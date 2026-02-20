// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Chainlink Price Feed Interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title VestingVault
 * @notice Manages token vesting with quarterly releases: 40% at TGE, then 20% at 3, 6, and 9 months
 * @dev All tokens held here during presale, released at TGE based on user's settings
 */
contract VestingVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ==================== STRUCTS ====================

    struct UserAllocation {
        uint256 totalTokens;        // Total tokens at $0.01 anchor
        uint256 immediateTokens;    // 40% unlocked at TGE
        uint256 vestingTokens;      // 60% subject to quarterly vesting
        uint256 claimedImmediate;   // How much immediate claimed
        uint256 claimedVesting;     // How much vesting claimed
        uint8 earlyAccessTier;      // 0=standard, 1=3h, 2=6h, 3=9h
        uint8 vestingCliff;         // 3, 6, 9, or 12 months (affects when quarterly releases start)
        uint256 vestingStartTime;   // When vesting starts (after cliff)
        bool immediateClaimed;      // Has claimed immediate tokens
    }

    // ==================== STATE VARIABLES ====================

    // Tokens
    IERC20 public ndgToken;
    
    // Presale contract (only it can record allocations)
    address public presaleContract;
    
    // Treasury address for receiving unsold tokens
    address public treasuryAddress;

    // User data
    mapping(address => UserAllocation) public allocations;
    
    // TGE timing
    uint256 public tgeTime;
    bool public tgeEnabled = false;
    
    // Early access unlock times (group-based)
    uint256 public earlyAccess3h;  // TGE - 3 hours
    uint256 public earlyAccess6h;  // TGE - 6 hours
    uint256 public earlyAccess9h;  // TGE - 9 hours
    
    // Fee settings
    address public liquidityFund;
    
    // Early access fees (in USD, 18 decimals)
    uint256 public constant FEE_EARLY_3H = 100 * 1e18;   // $100
    uint256 public constant FEE_EARLY_6H = 200 * 1e18;   // $200
    uint256 public constant FEE_EARLY_9H = 250 * 1e18;   // $250
    
    // Vesting reduction fees (in USD, 18 decimals)
    uint256 public constant FEE_CLIFF_9M = 300 * 1e18;   // $300
    uint256 public constant FEE_CLIFF_6M = 500 * 1e18;   // $500
    uint256 public constant FEE_CLIFF_3M = 750 * 1e18;   // $750
    
    // Payment options
    mapping(address => bool) public acceptedStablecoins;
    AggregatorV3Interface public bnbPriceFeed;
    
    // Cliff constants
    uint256 public constant CLIFF_12_MONTHS = 365 days;
    uint256 public constant CLIFF_9_MONTHS = 274 days;
    uint256 public constant CLIFF_6_MONTHS = 182 days;
    uint256 public constant CLIFF_3_MONTHS = 91 days;
    
    // NEW: Quarterly vesting schedule (from TGE/unlock time)
    uint256 public constant QUARTER_1 = 91 days;   // 3 months - 20% release
    uint256 public constant QUARTER_2 = 182 days;  // 6 months - 20% release
    uint256 public constant QUARTER_3 = 274 days;  // 9 months - 20% release
    
    // Totals
    uint256 public totalAllocated;
    uint256 public totalClaimed;

    // ==================== EVENTS ====================

    event AllocationRecorded(
        address indexed user,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens
    );
    
    event EarlyAccessPurchased(
        address indexed user,
        uint8 tier,
        uint256 feePaid,
        address paymentToken
    );
    
    event VestingReduced(
        address indexed user,
        uint8 newCliffMonths,
        uint256 feePaid,
        address paymentToken
    );
    
    event ImmediateTokensClaimed(address indexed user, uint256 amount);
    event VestingTokensClaimed(address indexed user, uint256 amount);
    event TGEEnabled(uint256 tgeTime);
    event LiquidityFundUpdated(address indexed newFund);
    event TreasuryAddressSet(address indexed treasury);
    event WithdrawnToTreasury(address indexed treasury, uint256 amount, uint256 timestamp);

    // ==================== CONSTRUCTOR ====================

    constructor(
        address _ndgToken,
        address _liquidityFund,
        address _bnbPriceFeed,
        address[] memory _stablecoins
    ) {
        require(_ndgToken != address(0), "Invalid token");
        require(_liquidityFund != address(0), "Invalid fund");
        require(_bnbPriceFeed != address(0), "Invalid price feed");
        
        ndgToken = IERC20(_ndgToken);
        liquidityFund = _liquidityFund;
        bnbPriceFeed = AggregatorV3Interface(_bnbPriceFeed);
        
        // Set accepted stablecoins
        for (uint256 i = 0; i < _stablecoins.length; i++) {
            acceptedStablecoins[_stablecoins[i]] = true;
        }
    }

    // ==================== MODIFIERS ====================

    modifier onlyPresale() {
        require(msg.sender == presaleContract, "Only presale");
        _;
    }

    modifier tgeActive() {
        require(tgeEnabled, "TGE not enabled");
        _;
    }

    // ==================== PRESALE FUNCTIONS ====================

    /**
     * @notice Set presale contract address (one time)
     */
    function setPresaleContract(address _presale) external onlyOwner {
        require(presaleContract == address(0), "Already set");
        require(_presale != address(0), "Invalid address");
        presaleContract = _presale;
    }

    /**
     * @notice Record user allocation (called by presale contract)
     */
    function recordAllocation(
        address user,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens
    ) external onlyPresale {
        UserAllocation storage allocation = allocations[user];
        
        allocation.totalTokens += totalTokens;
        allocation.immediateTokens += immediateTokens;
        allocation.vestingTokens += vestingTokens;
        
        // Default settings
        if (allocation.vestingCliff == 0) {
            allocation.vestingCliff = 12; // 12 months default
        }
        
        totalAllocated += totalTokens;
        
        emit AllocationRecorded(user, totalTokens, immediateTokens, vestingTokens);
    }

    // ==================== EARLY ACCESS FUNCTIONS ====================

    /**
     * @notice Purchase early TGE access (pay in final week before TGE)
     */
    function purchaseEarlyAccess(uint8 tier, address paymentToken, uint256 paymentAmount) 
        external 
        nonReentrant 
    {
        require(!tgeEnabled, "TGE already happened");
        require(tgeTime > 0, "TGE time not set");
        require(block.timestamp >= tgeTime - 7 days, "Not in final week");
        require(tier >= 1 && tier <= 3, "Invalid tier");
        
        UserAllocation storage allocation = allocations[msg.sender];
        require(allocation.totalTokens > 0, "No allocation");
        require(allocation.earlyAccessTier == 0, "Already purchased");
        
        // Calculate fee
        uint256 feeUSD;
        if (tier == 1) feeUSD = FEE_EARLY_3H;      // $100
        else if (tier == 2) feeUSD = FEE_EARLY_6H; // $200
        else feeUSD = FEE_EARLY_9H;                // $250
        
        // Process payment
        _processPayment(msg.sender, paymentToken, paymentAmount, feeUSD);
        
        // Set tier
        allocation.earlyAccessTier = tier;
        
        emit EarlyAccessPurchased(msg.sender, tier, feeUSD, paymentToken);
    }

    // ==================== VESTING REDUCTION FUNCTIONS ====================

    /**
     * @notice Reduce vesting cliff (pay anytime before cliff ends)
     */
    function reduceVestingCliff(uint8 newCliffMonths, address paymentToken, uint256 paymentAmount) 
        external 
        nonReentrant 
    {
        require(newCliffMonths == 3 || newCliffMonths == 6 || newCliffMonths == 9, "Invalid cliff");
        
        UserAllocation storage allocation = allocations[msg.sender];
        require(allocation.totalTokens > 0, "No allocation");
        require(newCliffMonths < allocation.vestingCliff, "Not a reduction");
        
        // If TGE happened, check cliff hasn't ended
        if (tgeEnabled) {
            uint256 cliffEndTime = _getCliffEndTime(msg.sender);
            require(block.timestamp < cliffEndTime, "Cliff already ended");
        }
        
        // Calculate fee
        uint256 feeUSD;
        if (newCliffMonths == 9) feeUSD = FEE_CLIFF_9M;      // $300
        else if (newCliffMonths == 6) feeUSD = FEE_CLIFF_6M; // $500
        else feeUSD = FEE_CLIFF_3M;                          // $750
        
        // Process payment
        _processPayment(msg.sender, paymentToken, paymentAmount, feeUSD);
        
        // Update cliff
        allocation.vestingCliff = newCliffMonths;
        
        emit VestingReduced(msg.sender, newCliffMonths, feeUSD, paymentToken);
    }

    // ==================== CLAIM FUNCTIONS ====================

    /**
     * @notice Claim immediate tokens (40% available at TGE based on early access tier)
     */
    function claimImmediate() external nonReentrant tgeActive {
        UserAllocation storage allocation = allocations[msg.sender];
        
        require(allocation.immediateTokens > 0, "No immediate tokens");
        require(!allocation.immediateClaimed, "Already claimed");
        
        // Check if unlock time has arrived
        uint256 unlockTime = _getUnlockTime(msg.sender);
        require(block.timestamp >= unlockTime, "Not unlocked yet");
        
        uint256 amount = allocation.immediateTokens;
        allocation.claimedImmediate = amount;
        allocation.immediateClaimed = true;
        totalClaimed += amount;
        
        ndgToken.safeTransfer(msg.sender, amount);
        
        emit ImmediateTokensClaimed(msg.sender, amount);
    }

    /**
     * @notice Claim vested tokens (60% released quarterly: 20% at 3, 6, 9 months)
     */
    function claimVested() external nonReentrant tgeActive {
        UserAllocation storage allocation = allocations[msg.sender];
        
        require(allocation.vestingTokens > 0, "No vesting tokens");
        
        uint256 claimable = getClaimableVesting(msg.sender);
        require(claimable > 0, "Nothing to claim");
        
        allocation.claimedVesting += claimable;
        totalClaimed += claimable;
        
        ndgToken.safeTransfer(msg.sender, claimable);
        
        emit VestingTokensClaimed(msg.sender, claimable);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Get user's unlock time for immediate tokens
     */
    function _getUnlockTime(address user) internal view returns (uint256) {
        UserAllocation memory allocation = allocations[user];
        
        if (allocation.earlyAccessTier == 3) return earlyAccess9h; // 9h early
        if (allocation.earlyAccessTier == 2) return earlyAccess6h; // 6h early
        if (allocation.earlyAccessTier == 1) return earlyAccess3h; // 3h early
        return tgeTime; // Standard
    }

    /**
     * @notice Get user's cliff end time
     */
    function _getCliffEndTime(address user) internal view returns (uint256) {
        UserAllocation memory allocation = allocations[user];
        uint256 unlockTime = _getUnlockTime(user);
        
        if (allocation.vestingCliff == 3) return unlockTime + CLIFF_3_MONTHS;
        if (allocation.vestingCliff == 6) return unlockTime + CLIFF_6_MONTHS;
        if (allocation.vestingCliff == 9) return unlockTime + CLIFF_9_MONTHS;
        return unlockTime + CLIFF_12_MONTHS;
    }

    /**
     * @notice Calculate claimable vesting tokens (NEW: Quarterly 20% releases)
     * @dev 60% vesting tokens released in 3 equal parts: 20% at 3, 6, and 9 months from unlock
     */
    function getClaimableVesting(address user) public view returns (uint256) {
        if (!tgeEnabled) return 0;
        
        UserAllocation memory allocation = allocations[user];
        if (allocation.vestingTokens == 0) return 0;
        
        uint256 unlockTime = _getUnlockTime(user);
        uint256 cliffEndTime = _getCliffEndTime(user);
        
        // Cliff hasn't ended yet
        if (block.timestamp < cliffEndTime) return 0;
        
        // Calculate how many quarters have passed since unlock time
        // Each quarter releases 20% of vesting tokens (60% / 3 = 20% per quarter)
        uint256 perQuarter = allocation.vestingTokens / 3; // 20% each
        uint256 totalVested = 0;
        
        // Quarter 1: 3 months from unlock (20%)
        if (block.timestamp >= unlockTime + QUARTER_1) {
            totalVested += perQuarter;
        }
        
        // Quarter 2: 6 months from unlock (20%)
        if (block.timestamp >= unlockTime + QUARTER_2) {
            totalVested += perQuarter;
        }
        
        // Quarter 3: 9 months from unlock (20%)
        if (block.timestamp >= unlockTime + QUARTER_3) {
            totalVested += perQuarter;
        }
        
        // Subtract already claimed
        uint256 claimable = totalVested > allocation.claimedVesting 
            ? totalVested - allocation.claimedVesting 
            : 0;
        
        return claimable;
    }

    /**
     * @notice Get user's full allocation info
     */
    function getUserInfo(address user) external view returns (
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens,
        uint256 claimedImmediate,
        uint256 claimedVesting,
        uint256 claimableVesting,
        uint8 earlyAccessTier,
        uint8 vestingCliff,
        uint256 unlockTime,
        uint256 cliffEndTime,
        bool immediateClaimed
    ) {
        UserAllocation memory allocation = allocations[user];
        
        return (
            allocation.totalTokens,
            allocation.immediateTokens,
            allocation.vestingTokens,
            allocation.claimedImmediate,
            allocation.claimedVesting,
            getClaimableVesting(user),
            allocation.earlyAccessTier,
            allocation.vestingCliff,
            _getUnlockTime(user),
            _getCliffEndTime(user),
            allocation.immediateClaimed
        );
    }

    // ==================== PAYMENT PROCESSING ====================

    /**
     * @notice Process fee payment (stablecoin, BNB, or NDG)
     */
    function _processPayment(
        address payer,
        address paymentToken,
        uint256 paymentAmount,
        uint256 feeUSD
    ) internal {
        if (paymentToken == address(0)) {
            // BNB payment
            require(msg.value == paymentAmount, "Wrong BNB amount");
            uint256 bnbPrice = _getBNBPrice();
            uint256 usdValue = (paymentAmount * bnbPrice) / 1e18;
            require(usdValue >= feeUSD, "Insufficient BNB");
            
            // Send to liquidity fund
            (bool success, ) = liquidityFund.call{value: paymentAmount}("");
            require(success, "BNB transfer failed");
            
        } else if (paymentToken == address(ndgToken)) {
            // NDG payment (deduct from user's allocation)
            UserAllocation storage allocation = allocations[payer];
            require(allocation.totalTokens >= paymentAmount, "Insufficient NDG");
            
            // Reduce allocation
            allocation.totalTokens -= paymentAmount;
            if (allocation.immediateTokens >= paymentAmount) {
                allocation.immediateTokens -= paymentAmount;
            } else {
                uint256 fromImmediate = allocation.immediateTokens;
                allocation.immediateTokens = 0;
                allocation.vestingTokens -= (paymentAmount - fromImmediate);
            }
            
            // Transfer to liquidity fund
            ndgToken.safeTransfer(liquidityFund, paymentAmount);
            
        } else {
            // Stablecoin payment
            require(acceptedStablecoins[paymentToken], "Token not accepted");
            
            // Assume 1:1 USD (normalize decimals)
            uint256 decimals = _getDecimals(paymentToken);
            uint256 usdValue = (paymentAmount * 1e18) / (10 ** decimals);
            require(usdValue >= feeUSD, "Insufficient payment");
            
            // Transfer from user to liquidity fund
            IERC20(paymentToken).safeTransferFrom(payer, liquidityFund, paymentAmount);
        }
    }

    /**
     * @notice Get BNB price in USD
     */
    function _getBNBPrice() internal view returns (uint256) {
        (, int256 price, , , ) = bnbPriceFeed.latestRoundData();
        require(price > 0, "Invalid BNB price");
        
        // Chainlink returns 8 decimals, normalize to 18
        return uint256(price) * 1e10;
    }

    /**
     * @notice Get token decimals
     */
    function _getDecimals(address token) internal view returns (uint256) {
        try IERC20Metadata(token).decimals() returns (uint8 decimals) {
            return decimals;
        } catch {
            return 18;
        }
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Enable TGE and set unlock times
     */
    function enableTGE(uint256 _tgeTime) external onlyOwner {
        require(!tgeEnabled, "Already enabled");
        require(_tgeTime > block.timestamp, "TGE in past");
        
        tgeTime = _tgeTime;
        tgeEnabled = true;
        
        // Set early access times
        earlyAccess3h = _tgeTime - 3 hours;
        earlyAccess6h = _tgeTime - 6 hours;
        earlyAccess9h = _tgeTime - 9 hours;
        
        emit TGEEnabled(_tgeTime);
    }

    /**
     * @notice Update liquidity fund address
     */
    function setLiquidityFund(address _fund) external onlyOwner {
        require(_fund != address(0), "Invalid address");
        liquidityFund = _fund;
        emit LiquidityFundUpdated(_fund);
    }

    /**
     * @notice Update accepted stablecoin
     */
    function setStablecoin(address token, bool accepted) external onlyOwner {
        acceptedStablecoins[token] = accepted;
    }

    /**
     * @notice Emergency withdraw (only unclaimed tokens)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @notice Burn unallocated tokens (called by presale contract after finalization)
     * @param amount Amount of tokens to burn
     */
    function burnUnallocatedTokens(uint256 amount) external onlyPresale {
        require(amount > 0, "Amount is zero");
        require(ndgToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        // Get the NDGToken interface with burn capability
        INDGToken(address(ndgToken)).burn(amount);
    }

    /**
     * @notice Set treasury address for receiving unsold tokens
     * @param _treasury Address of the treasury wallet
     */
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasuryAddress = _treasury;
        emit TreasuryAddressSet(_treasury);
    }

    /**
     * @notice Withdraw unsold tokens to treasury instead of burning
     * @param amount Amount of tokens to transfer to treasury
     * @dev Can only be called by presale contract
     */
    function withdrawToTreasury(uint256 amount) external onlyPresale {
        require(treasuryAddress != address(0), "Treasury not set");
        require(amount > 0, "Amount must be greater than 0");
        
        ndgToken.transfer(treasuryAddress, amount);
        emit WithdrawnToTreasury(treasuryAddress, amount, block.timestamp);
    }

    receive() external payable {
        revert("Use purchaseEarlyAccess() or reduceVestingCliff()");
    }
}

// Interface for ERC20 decimals
interface IERC20Metadata {
    function decimals() external view returns (uint8);
}

// Interface for NDG Token with burn
interface INDGToken is IERC20 {
    function burn(uint256 amount) external;
}