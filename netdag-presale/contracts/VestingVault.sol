// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}

/**
 * @title VestingVault
 * @notice Holds and releases buyer-owned NDG vesting allocations.
 * @dev This contract does not manage unsold tokens, treasury redistribution, resale reserve, or burn policy.
 */
contract VestingVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserAllocation {
        uint256 totalTokens;
        uint256 immediateTokens;
        uint256 vestingTokens;
        uint256 claimedImmediate;
        uint256 claimedVesting;
        uint8 earlyAccessTier;        // 0 = standard, 1 = 3h, 2 = 6h, 3 = 9h
        uint8 vestingDurationMonths;  // 9 = standard, 6 or 3 = paid accelerated vesting
        bool immediateClaimed;
    }

    IERC20 public immutable ndgToken;
    AggregatorV3Interface public immutable bnbPriceFeed;

    address public presaleContract;
    address public liquidityFund;

    mapping(address => UserAllocation) public allocations;
    mapping(address => bool) public acceptedStablecoins;

    uint256 public tgeTime;
    uint256 public earlyAccess3h;
    uint256 public earlyAccess6h;
    uint256 public earlyAccess9h;

    uint256 public totalAllocated;
    uint256 public totalClaimed;

    uint256 public constant FEE_EARLY_3H = 100 * 1e18;
    uint256 public constant FEE_EARLY_6H = 200 * 1e18;
    uint256 public constant FEE_EARLY_9H = 250 * 1e18;

    uint256 public constant FEE_VESTING_6M = 500 * 1e18;
    uint256 public constant FEE_VESTING_3M = 750 * 1e18;

    uint256 public constant STANDARD_VESTING_MONTHS = 9;
    uint256 public constant VESTING_6_MONTHS = 6;
    uint256 public constant VESTING_3_MONTHS = 3;

    uint256 public constant PRICE_FEED_STALENESS_LIMIT = 1 days;

    event PresaleContractSet(address indexed presaleContract);
    event AllocationRecorded(address indexed user, uint256 totalTokens, uint256 immediateTokens, uint256 vestingTokens);
    event EarlyAccessPurchased(address indexed user, uint8 tier, uint256 feeUSD, address paymentToken, uint256 paymentAmount);
    event VestingReduced(address indexed user, uint8 newVestingDurationMonths, uint256 feeUSD, address paymentToken, uint256 paymentAmount);
    event ImmediateTokensClaimed(address indexed user, uint256 amount);
    event VestingTokensClaimed(address indexed user, uint256 amount);
    event TGETimeSet(uint256 tgeTime);
    event LiquidityFundUpdated(address indexed newFund);
    event StablecoinUpdated(address indexed token, bool accepted);
    event EmergencyWithdrawal(address indexed token, address indexed to, uint256 amount);

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

        for (uint256 i = 0; i < _stablecoins.length; i++) {
            require(_stablecoins[i] != address(0), "Invalid stablecoin");
            acceptedStablecoins[_stablecoins[i]] = true;
            emit StablecoinUpdated(_stablecoins[i], true);
        }
    }

    modifier onlyPresale() {
        require(msg.sender == presaleContract, "Only presale");
        _;
    }

    function setPresaleContract(address _presale) external onlyOwner {
        require(presaleContract == address(0), "Already set");
        require(_presale != address(0), "Invalid presale");

        presaleContract = _presale;

        emit PresaleContractSet(_presale);
    }

    function setTGETime(uint256 _tgeTime) external onlyOwner {
        require(_tgeTime > block.timestamp, "TGE in past");

        if (tgeTime != 0) {
            require(block.timestamp < tgeTime - 7 days, "TGE locked");
        }

        tgeTime = _tgeTime;
        earlyAccess3h = _tgeTime - 3 hours;
        earlyAccess6h = _tgeTime - 6 hours;
        earlyAccess9h = _tgeTime - 9 hours;

        emit TGETimeSet(_tgeTime);
    }

    function recordAllocation(
        address user,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens
    ) external onlyPresale {
        require(user != address(0), "Invalid user");
        require(totalTokens > 0, "Zero allocation");
        require(totalTokens == immediateTokens + vestingTokens, "Invalid split");

        UserAllocation storage allocation = allocations[user];

        allocation.totalTokens += totalTokens;
        allocation.immediateTokens += immediateTokens;
        allocation.vestingTokens += vestingTokens;

        if (allocation.vestingDurationMonths == 0) {
            allocation.vestingDurationMonths = uint8(STANDARD_VESTING_MONTHS);
        }

        totalAllocated += totalTokens;

        require(
            ndgToken.balanceOf(address(this)) >= totalAllocated - totalClaimed,
            "Vault underfunded"
        );

        emit AllocationRecorded(user, totalTokens, immediateTokens, vestingTokens);
    }

    function purchaseEarlyAccess(
        uint8 tier,
        address paymentToken,
        uint256 paymentAmount
    ) external payable nonReentrant {
        require(tgeTime > 0, "TGE time not set");
        require(block.timestamp < tgeTime, "TGE passed");
        require(block.timestamp >= tgeTime - 7 days, "Not final week");
        require(tier >= 1 && tier <= 3, "Invalid tier");

        UserAllocation storage allocation = allocations[msg.sender];

        require(allocation.totalTokens > 0, "No allocation");
        require(allocation.earlyAccessTier == 0, "Already purchased");

        uint256 feeUSD;

        if (tier == 1) {
            feeUSD = FEE_EARLY_3H;
        } else if (tier == 2) {
            feeUSD = FEE_EARLY_6H;
        } else {
            feeUSD = FEE_EARLY_9H;
        }

        _processPayment(msg.sender, paymentToken, paymentAmount, feeUSD);

        allocation.earlyAccessTier = tier;

        emit EarlyAccessPurchased(msg.sender, tier, feeUSD, paymentToken, paymentAmount);
    }

    function reduceVestingDuration(
        uint8 newDurationMonths,
        address paymentToken,
        uint256 paymentAmount
    ) external payable nonReentrant {
        require(
            newDurationMonths == VESTING_6_MONTHS ||
            newDurationMonths == VESTING_3_MONTHS,
            "Invalid duration"
        );

        UserAllocation storage allocation = allocations[msg.sender];

        require(allocation.totalTokens > 0, "No allocation");

        if (allocation.vestingDurationMonths == 0) {
            allocation.vestingDurationMonths = uint8(STANDARD_VESTING_MONTHS);
        }

        require(newDurationMonths < allocation.vestingDurationMonths, "Not a reduction");

        uint256 feeUSD;

        if (newDurationMonths == VESTING_6_MONTHS) {
            feeUSD = FEE_VESTING_6M;
        } else {
            feeUSD = FEE_VESTING_3M;
        }

        _processPayment(msg.sender, paymentToken, paymentAmount, feeUSD);

        allocation.vestingDurationMonths = newDurationMonths;

        emit VestingReduced(msg.sender, newDurationMonths, feeUSD, paymentToken, paymentAmount);
    }

    function claimImmediate() external nonReentrant {
        require(tgeTime > 0, "TGE time not set");

        UserAllocation storage allocation = allocations[msg.sender];

        require(allocation.immediateTokens > 0, "No immediate tokens");
        require(!allocation.immediateClaimed, "Already claimed");

        uint256 unlockTime = getUnlockTime(msg.sender);
        require(block.timestamp >= unlockTime, "Not unlocked");

        uint256 amount = allocation.immediateTokens;

        allocation.claimedImmediate = amount;
        allocation.immediateClaimed = true;
        totalClaimed += amount;

        ndgToken.safeTransfer(msg.sender, amount);

        assert(totalClaimed <= totalAllocated);

        emit ImmediateTokensClaimed(msg.sender, amount);
    }

    function claimVested() external nonReentrant {
        require(tgeTime > 0, "TGE time not set");

        UserAllocation storage allocation = allocations[msg.sender];

        require(allocation.vestingTokens > 0, "No vesting tokens");

        uint256 claimable = getClaimableVesting(msg.sender);
        require(claimable > 0, "Nothing to claim");

        allocation.claimedVesting += claimable;
        totalClaimed += claimable;

        ndgToken.safeTransfer(msg.sender, claimable);

        assert(totalClaimed <= totalAllocated);

        emit VestingTokensClaimed(msg.sender, claimable);
    }

    function getUnlockTime(address user) public view returns (uint256) {
        UserAllocation memory allocation = allocations[user];

        if (allocation.earlyAccessTier == 3) {
            return earlyAccess9h;
        }

        if (allocation.earlyAccessTier == 2) {
            return earlyAccess6h;
        }

        if (allocation.earlyAccessTier == 1) {
            return earlyAccess3h;
        }

        return tgeTime;
    }

    function getClaimableVesting(address user) public view returns (uint256) {
        if (tgeTime == 0) {
            return 0;
        }

        UserAllocation memory allocation = allocations[user];

        if (allocation.vestingTokens == 0) {
            return 0;
        }

        uint256 unlockTime = getUnlockTime(user);

        uint8 durationMonths = allocation.vestingDurationMonths;

        if (durationMonths == 0) {
            durationMonths = uint8(STANDARD_VESTING_MONTHS);
        }

        uint256 firstRelease;
        uint256 secondRelease;
        uint256 thirdRelease;

        if (durationMonths == VESTING_3_MONTHS) {
            firstRelease = unlockTime + 30 days;
            secondRelease = unlockTime + 60 days;
            thirdRelease = unlockTime + 90 days;
        } else if (durationMonths == VESTING_6_MONTHS) {
            firstRelease = unlockTime + 60 days;
            secondRelease = unlockTime + 120 days;
            thirdRelease = unlockTime + 180 days;
        } else {
            firstRelease = unlockTime + 90 days;
            secondRelease = unlockTime + 180 days;
            thirdRelease = unlockTime + 270 days;
        }

        uint256 totalVested;

        if (block.timestamp >= firstRelease) {
            totalVested += allocation.vestingTokens / 3;
        }

        if (block.timestamp >= secondRelease) {
            totalVested += allocation.vestingTokens / 3;
        }

        if (block.timestamp >= thirdRelease) {
            totalVested = allocation.vestingTokens;
        }

        if (totalVested <= allocation.claimedVesting) {
            return 0;
        }

        return totalVested - allocation.claimedVesting;
    }

    function getUserInfo(address user)
        external
        view
        returns (
            uint256 totalTokens,
            uint256 immediateTokens,
            uint256 vestingTokens,
            uint256 claimedImmediate,
            uint256 claimedVesting,
            uint256 claimableVesting,
            uint8 earlyAccessTier,
            uint8 vestingDurationMonths,
            uint256 unlockTime,
            bool immediateClaimed
        )
    {
        UserAllocation memory allocation = allocations[user];

        uint8 durationMonths = allocation.vestingDurationMonths;

        if (durationMonths == 0) {
            durationMonths = uint8(STANDARD_VESTING_MONTHS);
        }

        return (
            allocation.totalTokens,
            allocation.immediateTokens,
            allocation.vestingTokens,
            allocation.claimedImmediate,
            allocation.claimedVesting,
            getClaimableVesting(user),
            allocation.earlyAccessTier,
            durationMonths,
            getUnlockTime(user),
            allocation.immediateClaimed
        );
    }

    function setLiquidityFund(address _fund) external onlyOwner {
        require(_fund != address(0), "Invalid fund");

        liquidityFund = _fund;

        emit LiquidityFundUpdated(_fund);
    }

    function setStablecoin(address token, bool accepted) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(token != address(ndgToken), "NDG not accepted as fee");

        acceptedStablecoins[token] = accepted;

        emit StablecoinUpdated(token, accepted);
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Zero amount");
        require(token != address(ndgToken), "Cannot withdraw NDG");

        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }

        emit EmergencyWithdrawal(token, owner(), amount);
    }

    function _processPayment(
        address payer,
        address paymentToken,
        uint256 paymentAmount,
        uint256 feeUSD
    ) internal {
        require(paymentAmount > 0, "Zero payment");
        require(feeUSD > 0, "Zero fee");

        if (paymentToken == address(0)) {
            require(msg.value == paymentAmount, "Wrong BNB amount");

            uint256 bnbPrice = _getBNBPrice();
            uint256 usdValue = (paymentAmount * bnbPrice) / 1e18;

            require(usdValue >= feeUSD, "Insufficient BNB");

            (bool success, ) = liquidityFund.call{value: paymentAmount}("");
            require(success, "BNB transfer failed");
        } else {
            require(msg.value == 0, "Do not send BNB");
            require(paymentToken != address(ndgToken), "NDG fee disabled");
            require(acceptedStablecoins[paymentToken], "Token not accepted");

            uint256 decimals = _getDecimals(paymentToken);
            uint256 usdValue = (paymentAmount * 1e18) / (10 ** decimals);

            require(usdValue >= feeUSD, "Insufficient payment");

            IERC20(paymentToken).safeTransferFrom(payer, liquidityFund, paymentAmount);
        }
    }

    function _getBNBPrice() internal view returns (uint256) {
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = bnbPriceFeed.latestRoundData();

        require(price > 0, "Invalid BNB price");
        require(updatedAt > 0, "No price update");
        require(block.timestamp - updatedAt <= PRICE_FEED_STALENESS_LIMIT, "Stale BNB price");
        require(answeredInRound >= roundId, "Incomplete price round");

        uint8 decimals = bnbPriceFeed.decimals();

        if (decimals < 18) {
            return uint256(price) * (10 ** (18 - decimals));
        }

        if (decimals > 18) {
            return uint256(price) / (10 ** (decimals - 18));
        }

        return uint256(price);
    }

    function _getDecimals(address token) internal view returns (uint256) {
        try IERC20Metadata(token).decimals() returns (uint8 decimals) {
            return decimals;
        } catch {
            return 18;
        }
    }

    receive() external payable {
        revert("Use payment functions");
    }
}