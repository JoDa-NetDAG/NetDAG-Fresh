// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
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

interface IVestingVault {
    function recordAllocation(
        address user,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens
    ) external;
    
    function burnUnallocatedTokens(uint256 amount) external;
    
    function withdrawToTreasury(uint256 amount) external;
}

/**
 * @title PresaleWithVesting
 * @notice Presale contract with 9-tier system and $0.01 anchor pricing
 * @dev All tokens are recorded in VestingVault during presale, transferred at TGE
 */
contract PresaleWithVesting is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ==================== STRUCTS ====================

    struct Tier {
        uint256 price;           // Price in USD (18 decimals)
        uint256 baseCap;         // Original NDG allocation for this tier
        uint256 rolloverTokens;  // Unsold tokens from previous tier
        uint256 totalAvailable;  // baseCap + rolloverTokens
        uint256 sold;            // Total tokens sold in this tier
        uint256 startTime;       // When tier started
        uint256 endTime;         // When tier ends (startTime + 30 days)
    }

    struct Purchase {
        uint256 totalTokens;     // Tokens calculated at $0.01 anchor
        uint256 immediateTokens; // Tokens based on tier price (released at TGE)
        uint256 vestingTokens;   // Bonus tokens (vested)
        uint256 usdAmount;       // USD invested
        uint256 tier;            // Which tier they bought in
    }

    // ==================== STATE VARIABLES ====================

    // Token & Vault
    IERC20 public ndgToken;
    IVestingVault public vestingVault;

    // Pricing
    uint256 public constant ANCHOR_PRICE = 0.01 * 1e18; // $0.01 (display price)
    uint256 public constant PRICE_DECIMALS = 1e18;
    uint256 public constant INITIAL_TOTAL_SUPPLY = 1_000_000_000 * 1e18; // 1 billion NDG

    // Tiers (9 tiers)
    Tier[9] public tiers;
    uint256 public currentTier = 0;
    uint256 public presaleStartTime;
    uint256 public presaleEndTime;
    bool public finalized = false;

    // Payment tokens
    mapping(address => bool) public acceptedStablecoins;
    AggregatorV3Interface public bnbPriceFeed;

    // Contribution limits
    uint256 public minContributionUSD = 50 * 1e18;         // $50 min
    uint256 public maxContributionUSD = 1000000 * 1e18;    // $1M max per wallet

    // User data
    mapping(address => Purchase[]) public userPurchases;
    mapping(address => uint256) public userTotalUSD;

    // Totals
    uint256 public totalRaisedUSD;
    uint256 public totalTokensAllocated;

    // TGE
    bool public tgeTriggered = false;
    uint256 public tgeTime;

    // Referral System
    uint256 public referralBonusPercent = 500; // 5% = 500 basis points
    mapping(address => address) public referrers; // buyer => referrer
    mapping(address => address[]) public referrals; // referrer => buyers[]
    mapping(address => uint256) public referralBonuses; // referrer => total bonus tokens

    // ==================== EVENTS ====================

    event Purchased(
        address indexed buyer,
        uint256 usdAmount,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens,
        uint256 tier,
        uint256 timestamp
    );

    event TierAdvanced(uint256 indexed newTier, uint256 totalAvailable, uint256 rolloverAmount, string reason);
    event TierSoldOut(uint256 indexed tier, uint256 totalSold);
    event TokensBurned(uint256 amount, uint256 timestamp);
    event FinalSupplyReduced(uint256 newTotalSupply);
    event PresaleFinalized(uint256 totalSold, uint256 totalBurned);
    event UnsoldToTreasury(uint256 amount, uint256 timestamp);
    event TGETriggered(uint256 tgeTime);
    event StablecoinUpdated(address token, bool accepted);
    event ContributionLimitsUpdated(uint256 min, uint256 max);
    event FundsWithdrawn(address token, uint256 amount);
    event PresaleStarted(uint256 startTime, uint256 endTime);
    event ReferralBonus(
        address indexed referrer,
        address indexed buyer,
        uint256 bonusTokens,
        uint256 usdAmount,
        uint256 timestamp
    );
    event ReferralBonusPercentUpdated(uint256 newPercent);

    // ==================== CONSTRUCTOR ====================

    constructor(
        address _ndgToken,
        address _vestingVault,
        address _bnbPriceFeed,
        address[] memory _stablecoins
    ) {
        require(_ndgToken != address(0), "Invalid token");
        require(_vestingVault != address(0), "Invalid vault");
        require(_bnbPriceFeed != address(0), "Invalid price feed");

        ndgToken = IERC20(_ndgToken);
        vestingVault = IVestingVault(_vestingVault);
        bnbPriceFeed = AggregatorV3Interface(_bnbPriceFeed);

        // Initialize 9 tiers
        _initializeTiers();

        // Set accepted stablecoins
        for (uint256 i = 0; i < _stablecoins.length; i++) {
            acceptedStablecoins[_stablecoins[i]] = true;
        }
    }

    // ==================== INITIALIZATION ====================

    /**
     * @notice Initialize 9 tiers with prices in 18 decimals
     */
    function _initializeTiers() internal {
        // Tier 1: $0.006
        tiers[0] = Tier({
            price: 6 * 1e15,  // 0.006 * 1e18
            baseCap: 108_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 108_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 2: $0.009
        tiers[1] = Tier({
            price: 9 * 1e15,  // 0.009 * 1e18
            baseCap: 96_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 96_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 3: $0.013
        tiers[2] = Tier({
            price: 13 * 1e15,  // 0.013 * 1e18
            baseCap: 84_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 84_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 4: $0.017
        tiers[3] = Tier({
            price: 17 * 1e15,  // 0.017 * 1e18
            baseCap: 72_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 72_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 5: $0.021
        tiers[4] = Tier({
            price: 21 * 1e15,  // 0.021 * 1e18
            baseCap: 60_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 60_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 6: $0.025
        tiers[5] = Tier({
            price: 25 * 1e15,  // 0.025 * 1e18
            baseCap: 60_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 60_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 7: $0.028
        tiers[6] = Tier({
            price: 28 * 1e15,  // 0.028 * 1e18
            baseCap: 48_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 48_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 8: $0.12
        tiers[7] = Tier({
            price: 12 * 1e16,  // 0.12 * 1e18
            baseCap: 42_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 42_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
        
        // Tier 9: $0.16
        tiers[8] = Tier({
            price: 16 * 1e16,  // 0.16 * 1e18
            baseCap: 30_000_000 * 1e18,
            rolloverTokens: 0,
            totalAvailable: 30_000_000 * 1e18,
            sold: 0,
            startTime: 0,
            endTime: 0
        });
    }

    // ==================== PURCHASE FUNCTIONS ====================

    /**
     * @notice Buy with BNB
     * @param referrer Optional referrer address (pass address(0) for no referral)
     */
    function buyWithBNB(address referrer) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "No BNB sent");
        require(!tgeTriggered, "Presale ended");
        require(presaleStartTime > 0, "Presale not started");
        require(block.timestamp < presaleEndTime, "Presale period ended");

        // Get BNB price in USD
        uint256 bnbPriceUSD = getBNBPrice();
        uint256 usdAmount = (msg.value * bnbPriceUSD) / 1e18;

        _processPurchase(msg.sender, usdAmount, referrer);
    }

    /**
     * @notice Buy with stablecoin (USDT/USDC/BUSD)
     * @param stablecoin Stablecoin address
     * @param amount Amount in stablecoin decimals
     * @param referrer Optional referrer address (pass address(0) for no referral)
     */
    function buyWithStablecoin(address stablecoin, uint256 amount, address referrer) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(acceptedStablecoins[stablecoin], "Stablecoin not accepted");
        require(amount > 0, "Invalid amount");
        require(!tgeTriggered, "Presale ended");
        require(presaleStartTime > 0, "Presale not started");
        require(block.timestamp < presaleEndTime, "Presale period ended");

        // Transfer stablecoin from user
        IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), amount);

        // Normalize to 18 decimals (handle USDT/USDC with 6 decimals)
        uint256 decimals = _getDecimals(stablecoin);
        uint256 usdAmount = (amount * 1e18) / (10 ** decimals);

        _processPurchase(msg.sender, usdAmount, referrer);
    }

    /**
     * @notice Check and advance tier if conditions met (time expired OR sold out)
     */
    function checkAndAdvanceTier() public {
        if (currentTier >= 9) return; // All tiers completed
        
        // Check if tier should advance
        bool timeExpired = tiers[currentTier].startTime > 0 && block.timestamp >= tiers[currentTier].endTime;
        bool soldOut = tiers[currentTier].sold >= tiers[currentTier].totalAvailable;
        
        if (timeExpired || soldOut) {
            // Calculate unsold tokens
            uint256 unsold = tiers[currentTier].totalAvailable - tiers[currentTier].sold;
            
            // Advance to next tier
            currentTier++;
            
            if (currentTier < 9) {
                // Add rollover to next tier
                tiers[currentTier].rolloverTokens = unsold;
                tiers[currentTier].totalAvailable = tiers[currentTier].baseCap + unsold;
                tiers[currentTier].startTime = block.timestamp;
                tiers[currentTier].endTime = block.timestamp + 30 days;
                
                emit TierAdvanced(currentTier, tiers[currentTier].totalAvailable, unsold, soldOut ? "SOLD_OUT" : "TIME_EXPIRED");
            }
        }
    }

    /**
     * @notice Internal purchase logic
     * @param buyer Address of the buyer
     * @param usdAmount USD amount invested
     * @param referrer Optional referrer address (pass address(0) for no referral)
     */
    function _processPurchase(address buyer, uint256 usdAmount, address referrer) internal {
        // Check if tier should advance before processing purchase
        checkAndAdvanceTier();
        
        // Check contribution limits
        require(usdAmount >= minContributionUSD, "Below minimum");
        // Allow owner to bypass max contribution limit
        // This enables large purchases for liquidity and testing scenarios
        if (buyer != owner()) {
            require(userTotalUSD[buyer] + usdAmount <= maxContributionUSD, "Exceeds maximum");
        }
        require(currentTier < 9, "All tiers sold out");

        // Calculate tokens
        (
            uint256 totalTokens,
            uint256 immediateTokens,
            uint256 vestingTokens,
            uint256 finalTier
        ) = _calculateTokens(usdAmount);

        // Update state
        userTotalUSD[buyer] += usdAmount;
        totalRaisedUSD += usdAmount;
        totalTokensAllocated += totalTokens;

        // Record purchase
        userPurchases[buyer].push(Purchase({
            totalTokens: totalTokens,
            immediateTokens: immediateTokens,
            vestingTokens: vestingTokens,
            usdAmount: usdAmount,
            tier: finalTier
        }));

        // Record allocation in VestingVault
        vestingVault.recordAllocation(
            buyer,
            totalTokens,
            immediateTokens,
            vestingTokens
        );

        emit Purchased(
            buyer,
            usdAmount,
            totalTokens,
            immediateTokens,
            vestingTokens,
            finalTier,
            block.timestamp
        );

        // Process referral bonus (if valid referrer)
        // In discount tiers: use immediateTokens (what buyer actually gets)
        // In premium tiers: use totalTokens (anchor value)
        if (referrer != address(0) && referrer != buyer && referralBonusPercent > 0) {
            uint256 bonusBase = immediateTokens > totalTokens ? immediateTokens : totalTokens;
            _processReferral(buyer, referrer, bonusBase, usdAmount);
        }
    }

    /**
     * @notice Process referral bonus
     * @param buyer Address of the buyer
     * @param referrer Address of the referrer
     * @param bonusBase Token amount to calculate bonus from
     * @param usdAmount USD amount invested
     */
    function _processReferral(address buyer, address referrer, uint256 bonusBase, uint256 usdAmount) internal {
        // Calculate 5% bonus
        uint256 bonusTokens = (bonusBase * referralBonusPercent) / 10000;
        
        // Record referral relationship (only first time)
        if (referrers[buyer] == address(0)) {
            referrers[buyer] = referrer;
            referrals[referrer].push(buyer);
        }
        
        // Track bonus tokens
        referralBonuses[referrer] += bonusTokens;
        totalTokensAllocated += bonusTokens;
        
        // Allocate bonus tokens to referrer (all immediate, no vesting)
        vestingVault.recordAllocation(
            referrer,
            bonusTokens,
            bonusTokens,
            0
        );
        
        emit ReferralBonus(
            referrer,
            buyer,
            bonusTokens,
            usdAmount,
            block.timestamp
        );
    }

    /**
     * @notice Calculate tokens based on current tier(s) and anchor price
     * @dev Handles purchases that span multiple tiers
     */
    function _calculateTokens(uint256 usdAmount) 
        internal 
        returns (
            uint256 totalTokens,
            uint256 immediateTokens,
            uint256 vestingTokens,
            uint256 finalTier
        ) 
    {
        // Calculate total tokens at anchor price ($0.01)
        totalTokens = (usdAmount * PRICE_DECIMALS) / ANCHOR_PRICE;

        uint256 remainingUSD = usdAmount;
        uint256 maxTierLoops = 9; // Safety limit - max 9 tiers
        uint256 tierLoops = 0;

        // Calculate immediate tokens at tier price(s)
        while (remainingUSD > 0 && currentTier < 9 && tierLoops < maxTierLoops) {
            tierLoops++;
            Tier storage tier = tiers[currentTier];
            
            // Calculate how many tokens this USD amount would buy at current tier price
            uint256 tokensAtTierPrice = (remainingUSD * PRICE_DECIMALS) / tier.price;
            
            // Check tier capacity (base + rollover)
            uint256 tierRemaining = tier.totalAvailable - tier.sold;
            
            if (tierRemaining == 0) {
                // Tier is full, advance
                checkAndAdvanceTier();
                if (currentTier >= 9) {
                    revert("Presale cap reached");
                }
                continue;
            }

            // How many tokens can we actually sell in this tier?
            uint256 tokensInTier = tokensAtTierPrice > tierRemaining 
                ? tierRemaining 
                : tokensAtTierPrice;
            
            // Calculate USD spent for these tokens
            uint256 usdForTokens = (tokensInTier * tier.price) / PRICE_DECIMALS;
            
            // Safety: Prevent underflow due to rounding errors
            // If calculated USD exceeds remaining, cap it and recalculate tokens
            if (usdForTokens > remainingUSD) {
                usdForTokens = remainingUSD;
                tokensInTier = (remainingUSD * PRICE_DECIMALS) / tier.price;
            }
            
            // Add to immediate tokens
            immediateTokens += tokensInTier;
            
            // Update tier sold amount
            tier.sold += tokensInTier;
            remainingUSD -= usdForTokens;
            
            // Check if this purchase causes tier to sell out
            if (tier.sold >= tier.totalAvailable) {
                emit TierSoldOut(currentTier, tier.sold);
                // Advance tier immediately when sold out
                checkAndAdvanceTier();
                if (currentTier >= 9 && remainingUSD > 0) {
                    revert("Presale cap reached");
                }
            }
            
            // If we've spent all the USD, we're done
            if (remainingUSD == 0) {
                break;
            }
        }

        // Allow tiny rounding dust (< $0.01) to remain due to integer division
        require(remainingUSD < ANCHOR_PRICE, "Insufficient presale capacity");

        // Token allocation logic:
        // - totalTokens: USD value at anchor price ($0.01) - for accounting only
        // - immediateTokens: Actual tokens user receives at TGE (based on tier price)
        // - vestingTokens: Bonus tokens that vest over time
        //
        // Discount tiers (tier price < anchor price):
        //   User gets a DISCOUNT - pays less per token
        //   Example: $600 investment at Tier 1 ($0.006):
        //     - totalTokens: 60,000 (anchor value tracking - NOT what user receives)
        //     - immediateTokens: 100,000 (actual tokens at TGE)
        //     - vestingTokens: 0 (no bonus - the discount IS the benefit)
        //   User receives: 100,000 tokens total (all immediate)
        //
        // Premium tiers (tier price > anchor price):
        //   User pays MORE per token but gets bonus vesting tokens to compensate
        //   Example: $600 investment at Tier 5 ($0.021):
        //     - totalTokens: 60,000 (anchor value tracking)
        //     - immediateTokens: ~28,571 (actual tokens at TGE)
        //     - vestingTokens: ~31,429 (bonus to reach anchor value)
        //   User receives: 60,000 tokens total (28,571 immediate + 31,429 vesting)
        
        // For discount tiers: keep totalTokens at anchor, give more immediate tokens
        // For premium tiers: keep totalTokens at anchor, split into immediate + vesting
        if (immediateTokens > totalTokens) {
            // Discount tier - user gets more immediate tokens, no vesting
            // totalTokens stays at anchor value (for accounting)
            // User receives immediateTokens (> totalTokens)
            vestingTokens = 0;
        } else {
            // Premium tier - user gets totalTokens split between immediate and vesting
            // User receives totalTokens (= immediate + vesting)
            vestingTokens = totalTokens - immediateTokens;
        }
        
        finalTier = currentTier;
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Get BNB price in USD from Chainlink
     */
    function getBNBPrice() public view returns (uint256) {
        (, int256 price, , , ) = bnbPriceFeed.latestRoundData();
        require(price > 0, "Invalid BNB price");
        
        // Chainlink returns price with 8 decimals, normalize to 18
        return uint256(price) * 1e10;
    }

    /**
     * @notice Get user's total allocation
     */
    function getUserAllocation(address user) 
        external 
        view 
        returns (
            uint256 totalTokens,
            uint256 immediateTokens,
            uint256 vestingTokens,
            uint256 usdInvested
        ) 
    {
        Purchase[] memory purchases = userPurchases[user];
        
        for (uint256 i = 0; i < purchases.length; i++) {
            totalTokens += purchases[i].totalTokens;
            immediateTokens += purchases[i].immediateTokens;
            vestingTokens += purchases[i].vestingTokens;
            usdInvested += purchases[i].usdAmount;
        }
    }

    /**
     * @notice Get current tier info
     */
    function getCurrentTierInfo() external view returns (
        uint256 tierIndex,
        uint256 price,
        uint256 totalAvailable,
        uint256 sold,
        uint256 remaining
    ) {
        if (currentTier >= 9) {
            return (currentTier, 0, 0, 0, 0);
        }

        Tier memory tier = tiers[currentTier];
        return (
            currentTier,
            tier.price,
            tier.totalAvailable,
            tier.sold,
            tier.totalAvailable - tier.sold
        );
    }

    /**
     * @notice Calculate tokens for a given USD amount (preview)
     * @dev Limited to checking maximum 3 tiers ahead for gas efficiency
     */
    function previewPurchase(uint256 usdAmount) 
        external 
        view 
        returns (
            uint256 totalTokens,
            uint256 immediateTokens,
            uint256 vestingTokens
        ) 
    {
        // Total at anchor price
        totalTokens = (usdAmount * PRICE_DECIMALS) / ANCHOR_PRICE;

        // Simulate immediate tokens calculation
        uint256 remainingUSD = usdAmount;
        uint256 tier = currentTier;
        uint256 tiersChecked = 0;
        uint256 maxTiersToCheck = 3; // Limit preview to 3 tiers for gas efficiency

        while (remainingUSD > 0 && tier < 9 && tiersChecked < maxTiersToCheck) {
            Tier memory t = tiers[tier];
            
            // Calculate tokens at tier price
            uint256 tokensAtTierPrice = (remainingUSD * PRICE_DECIMALS) / t.price;
            uint256 tierRemaining = t.totalAvailable - t.sold;

            if (tierRemaining == 0) {
                tier++;
                tiersChecked++;
                continue;
            }

            uint256 tokensInTier = tokensAtTierPrice > tierRemaining 
                ? tierRemaining 
                : tokensAtTierPrice;
            
            uint256 usdForTokens = (tokensInTier * t.price) / PRICE_DECIMALS;
            
            // Safety: Prevent underflow due to rounding errors
            if (usdForTokens > remainingUSD) {
                usdForTokens = remainingUSD;
                tokensInTier = (remainingUSD * PRICE_DECIMALS) / t.price;
            }
            
            immediateTokens += tokensInTier;
            remainingUSD -= usdForTokens;

            if (t.sold + tokensInTier >= t.totalAvailable) {
                tier++;
            }
            
            tiersChecked++;
        }

        // Handle discount vs premium tier scenarios (see _calculateTokens for detailed explanation)
        if (immediateTokens > totalTokens) {
            // Discount tier - keep totalTokens at anchor value, no vesting
            vestingTokens = 0;
        } else {
            vestingTokens = totalTokens - immediateTokens;
        }
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Trigger TGE (unlock immediate tokens)
     */
    function triggerTGE() external onlyOwner {
        require(!tgeTriggered, "TGE already triggered");
        
        tgeTriggered = true;
        tgeTime = block.timestamp;

        emit TGETriggered(tgeTime);
    }

    /**
     * @notice Start the presale
     */
    function startPresale() external onlyOwner {
        require(presaleStartTime == 0, "Already started");
        
        presaleStartTime = block.timestamp;
        presaleEndTime = block.timestamp + 270 days; // 9 months
        
        // Initialize first tier
        tiers[0].startTime = block.timestamp;
        tiers[0].endTime = block.timestamp + 30 days;
        
        emit PresaleStarted(presaleStartTime, presaleEndTime);
    }

    /**
     * @notice Finalize presale and send unsold tokens to Treasury
     * @dev Treasury will manually distribute: 20% Bonding, 10% Staking, 10% Gas-Free, 10% Ops, 50% Resale/Burn
     */
    function finalizePresale() external onlyOwner {
        require(block.timestamp >= presaleEndTime || currentTier >= 9, "Presale still active");
        require(!finalized, "Already finalized");
        
        // Calculate total unsold tokens
        uint256 totalUnsold = 0;
        uint256 lastCompletedTier = currentTier < 9 ? currentTier : 8;
        
        for (uint256 i = 0; i <= lastCompletedTier; i++) {
            totalUnsold += tiers[i].totalAvailable - tiers[i].sold;
        }
        
        if (currentTier < 9) {
            for (uint256 i = currentTier + 1; i < 9; i++) {
                totalUnsold += tiers[i].baseCap;
            }
        }
        
        uint256 totalSold = 0;
        for (uint256 i = 0; i <= lastCompletedTier; i++) {
            totalSold += tiers[i].sold;
        }
        
        if (totalUnsold > 0) {
            // Send to Treasury instead of burning ✅
            vestingVault.withdrawToTreasury(totalUnsold);
            emit UnsoldToTreasury(totalUnsold, block.timestamp);
        }
        
        finalized = true;
        emit PresaleFinalized(totalSold, totalUnsold);
    }

    /**
     * @notice Update accepted stablecoin
     */
    function setStablecoin(address token, bool accepted) external onlyOwner {
        acceptedStablecoins[token] = accepted;
        emit StablecoinUpdated(token, accepted);
    }

    /**
     * @notice Update contribution limits
     */
    function setContributionLimits(uint256 min, uint256 max) external onlyOwner {
        require(min <= max, "Invalid limits");
        minContributionUSD = min;
        maxContributionUSD = max;
        emit ContributionLimitsUpdated(min, max);
    }

    /**
     * @notice Update referral bonus percentage (in basis points)
     * @param newPercent New percentage (500 = 5%)
     */
    function setReferralBonusPercent(uint256 newPercent) external onlyOwner {
        require(newPercent <= 2000, "Max 20%"); // Safety cap at 20%
        referralBonusPercent = newPercent;
        emit ReferralBonusPercentUpdated(newPercent);
    }

    // ==================== REFERRAL VIEW FUNCTIONS ====================

    /**
     * @notice Get referral info for an address
     * @param user Address to query
     * @return referrer The referrer address (address(0) if none)
     * @return totalBonus Total bonus tokens earned
     * @return referralCount Number of referrals
     */
    function getReferralInfo(address user) 
        external 
        view 
        returns (
            address referrer,
            uint256 totalBonus,
            uint256 referralCount
        ) 
    {
        referrer = referrers[user];
        totalBonus = referralBonuses[user];
        referralCount = referrals[user].length;
    }

    /**
     * @notice Get list of referrals for an address
     * @param referrer Address to query
     * @return List of addresses referred by this user
     */
    function getReferrals(address referrer) external view returns (address[] memory) {
        return referrals[referrer];
    }

    /**
     * @notice Get referral bonus tokens for an address
     * @param referrer Address to query
     * @return Total bonus tokens earned
     */
    function getReferralBonus(address referrer) external view returns (uint256) {
        return referralBonuses[referrer];
    }

    /**
     * @notice Update tier base cap (before presale starts)
     */
    function setTierBaseCap(uint256 tierIndex, uint256 newBaseCap) external onlyOwner {
        require(tierIndex < 9, "Invalid tier");
        require(tiers[tierIndex].sold == 0, "Tier already active");
        tiers[tierIndex].baseCap = newBaseCap;
        tiers[tierIndex].totalAvailable = newBaseCap;
    }

    /**
     * @notice Withdraw BNB
     */
    function withdrawBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(address(0), balance);
    }

    /**
     * @notice Withdraw stablecoins
     */
    function withdrawStablecoin(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance");
        
        IERC20(token).safeTransfer(owner(), balance);
        emit FundsWithdrawn(token, balance);
    }

    /**
     * @notice Pause presale
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause presale
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ==================== INTERNAL HELPERS ====================

    function _getDecimals(address token) internal view returns (uint256) {
        // Try to get decimals, default to 18
        try IERC20Metadata(token).decimals() returns (uint8 decimals) {
            return decimals;
        } catch {
            return 18;
        }
    }

    receive() external payable {
        revert("Use buyWithBNB()");
    }
}

// Interface for ERC20 decimals
interface IERC20Metadata {
    function decimals() external view returns (uint8);
}