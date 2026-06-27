// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
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

interface IVestingVault {
    function recordAllocation(
        address user,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens
    ) external;
}

contract PresaleWithVesting is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Tier {
        uint256 priceUSD;
        uint256 baseCap;
        uint256 rolloverTokens;
        uint256 totalAvailable;
        uint256 sold;
        uint256 startTime;
        uint256 endTime;
    }

    struct BuyerSummary {
        uint256 totalUSD;
        uint256 totalTokens;
        uint256 immediateTokens;
        uint256 vestingTokens;
        uint256 purchaseCount;
    }

    IERC20 public immutable ndgToken;
    IVestingVault public immutable vestingVault;
    AggregatorV3Interface public immutable bnbPriceFeed;

    address public treasuryWallet;

    uint256 public constant PRICE_DECIMALS = 1e18;
    uint256 public constant PRESALE_DIRECT_CAP = 558_000_000 * 1e18;
    uint256 public constant REFERRAL_RESERVE_CAP = 42_000_000 * 1e18;
    uint256 public constant TOTAL_PRESALE_CAP = 600_000_000 * 1e18;

    uint256 public constant TIER_DURATION = 30 days;
    uint256 public constant PRESALE_DURATION = 270 days;
    uint256 public constant PRICE_FEED_STALENESS_LIMIT = 1 days;

    uint256 public constant TGE_UNLOCK_PERCENT = 4000;
    uint256 public constant BASIS_POINTS = 10000;

    Tier[9] public tiers;
    uint256 public currentTier;

    uint256 public presaleStartTime;
    uint256 public presaleEndTime;
    bool public presaleStarted;
    bool public finalized;

    bool public tgeTriggered;
    uint256 public tgeTime;

    mapping(address => bool) public acceptedStablecoins;
    mapping(address => BuyerSummary) public buyerSummaries;
    mapping(address => uint256) public userTotalUSD;

    uint256 public minContributionUSD = 50 * 1e18;
    uint256 public maxContributionUSD = 1_000_000 * 1e18;

    uint256 public totalRaisedUSD;
    uint256 public totalDirectTokensSold;
    uint256 public totalReferralTokensAllocated;
    uint256 public totalTokensAllocatedToVault;

    uint256 public referralBonusPercent = 500;

    mapping(address => address) public referrers;
    mapping(address => address[]) public referrals;
    mapping(address => uint256) public referralBonuses;

    event PresaleStarted(uint256 startTime, uint256 endTime);
    event Purchased(
        address indexed buyer,
        uint256 usdAmount,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens,
        uint256 finalTier,
        uint256 timestamp
    );
    event ReferralBonus(
        address indexed referrer,
        address indexed buyer,
        uint256 bonusTokens,
        uint256 usdAmount,
        uint256 timestamp
    );
    event TierAdvanced(
        uint256 indexed newTier,
        uint256 totalAvailable,
        uint256 rolloverAmount,
        string reason
    );
    event TierSoldOut(uint256 indexed tier, uint256 totalSold);
    event PresaleFinalized(
        uint256 totalDirectTokensSold,
        uint256 totalReferralTokensAllocated,
        uint256 unsoldTransferredToTreasury,
        uint256 timestamp
    );
    event UnsoldTransferredToTreasury(address indexed treasury, uint256 amount, uint256 timestamp);
    event TGETriggered(uint256 tgeTime);
    event StablecoinUpdated(address indexed token, bool accepted);
    event ContributionLimitsUpdated(uint256 min, uint256 max);
    event ReferralBonusPercentUpdated(uint256 newPercent);
    event TreasuryWalletUpdated(address indexed treasuryWallet);
    event FundsForwarded(address indexed token, address indexed to, uint256 amount);
    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount);

    constructor(
        address _ndgToken,
        address _vestingVault,
        address _bnbPriceFeed,
        address _treasuryWallet,
        address[] memory _stablecoins
    ) {
        require(_ndgToken != address(0), "Invalid token");
        require(_vestingVault != address(0), "Invalid vault");
        require(_bnbPriceFeed != address(0), "Invalid price feed");
        require(_treasuryWallet != address(0), "Invalid treasury");

        ndgToken = IERC20(_ndgToken);
        vestingVault = IVestingVault(_vestingVault);
        bnbPriceFeed = AggregatorV3Interface(_bnbPriceFeed);
        treasuryWallet = _treasuryWallet;

        _initializeTiers();

        for (uint256 i = 0; i < _stablecoins.length; i++) {
            require(_stablecoins[i] != address(0), "Invalid stablecoin");
            acceptedStablecoins[_stablecoins[i]] = true;
            emit StablecoinUpdated(_stablecoins[i], true);
        }

        emit TreasuryWalletUpdated(_treasuryWallet);
    }

    function _initializeTiers() internal {
        tiers[0] = Tier(6 * 1e15, 108_000_000 * 1e18, 0, 108_000_000 * 1e18, 0, 0, 0);
        tiers[1] = Tier(12 * 1e15, 84_000_000 * 1e18, 0, 84_000_000 * 1e18, 0, 0, 0);
        tiers[2] = Tier(18 * 1e15, 72_000_000 * 1e18, 0, 72_000_000 * 1e18, 0, 0, 0);
        tiers[3] = Tier(24 * 1e15, 66_000_000 * 1e18, 0, 66_000_000 * 1e18, 0, 0, 0);
        tiers[4] = Tier(30 * 1e15, 60_000_000 * 1e18, 0, 60_000_000 * 1e18, 0, 0, 0);
        tiers[5] = Tier(54 * 1e15, 54_000_000 * 1e18, 0, 54_000_000 * 1e18, 0, 0, 0);
        tiers[6] = Tier(84 * 1e15, 48_000_000 * 1e18, 0, 48_000_000 * 1e18, 0, 0, 0);
        tiers[7] = Tier(120 * 1e15, 36_000_000 * 1e18, 0, 36_000_000 * 1e18, 0, 0, 0);
        tiers[8] = Tier(160 * 1e15, 30_000_000 * 1e18, 0, 30_000_000 * 1e18, 0, 0, 0);
    }

    function startPresale() external onlyOwner {
        require(!presaleStarted, "Already started");
        require(ndgToken.balanceOf(address(this)) >= TOTAL_PRESALE_CAP, "Presale not funded");

        presaleStarted = true;
        presaleStartTime = block.timestamp;
        presaleEndTime = block.timestamp + PRESALE_DURATION;

        tiers[0].startTime = block.timestamp;
        tiers[0].endTime = block.timestamp + TIER_DURATION;

        emit PresaleStarted(presaleStartTime, presaleEndTime);
    }

    function buyWithBNB(address referrer) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "No BNB sent");
        require(_saleActive(), "Presale inactive");

        uint256 bnbPriceUSD = getBNBPrice();
        uint256 usdAmount = (msg.value * bnbPriceUSD) / 1e18;

        _processPurchase(msg.sender, usdAmount, referrer);

        _forwardBNBToTreasury(msg.value);
    }

    function buyWithStablecoin(
        address stablecoin,
        uint256 amount,
        address referrer
    ) external nonReentrant whenNotPaused {
        require(_saleActive(), "Presale inactive");
        require(stablecoin != address(0), "Invalid stablecoin");
        require(acceptedStablecoins[stablecoin], "Stablecoin not accepted");
        require(amount > 0, "Invalid amount");

        IERC20(stablecoin).safeTransferFrom(msg.sender, treasuryWallet, amount);

        uint256 decimals = _getDecimals(stablecoin);
        uint256 usdAmount = (amount * 1e18) / (10 ** decimals);

        _processPurchase(msg.sender, usdAmount, referrer);

        emit FundsForwarded(stablecoin, treasuryWallet, amount);
    }

    function _processPurchase(
        address buyer,
        uint256 usdAmount,
        address referrer
    ) internal {
        _advanceTierIfNeeded();

        require(currentTier < 9, "All tiers completed");
        require(usdAmount >= minContributionUSD, "Below minimum");

        if (buyer != owner()) {
            require(userTotalUSD[buyer] + usdAmount <= maxContributionUSD, "Exceeds maximum");
        }

        (uint256 totalTokens, uint256 finalTier) = _calculateAndConsumeTokens(usdAmount);

        require(totalTokens > 0, "Zero tokens");

        uint256 immediateTokens = (totalTokens * TGE_UNLOCK_PERCENT) / BASIS_POINTS;
        uint256 vestingTokens = totalTokens - immediateTokens;

        buyerSummaries[buyer].totalUSD += usdAmount;
        buyerSummaries[buyer].totalTokens += totalTokens;
        buyerSummaries[buyer].immediateTokens += immediateTokens;
        buyerSummaries[buyer].vestingTokens += vestingTokens;
        buyerSummaries[buyer].purchaseCount += 1;

        userTotalUSD[buyer] += usdAmount;
        totalRaisedUSD += usdAmount;
        totalDirectTokensSold += totalTokens;
        totalTokensAllocatedToVault += totalTokens;

        _fundVaultAndRecordAllocation(
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

        if (referrer != address(0) && referrer != buyer && referralBonusPercent > 0) {
            _processReferral(buyer, referrer, totalTokens, usdAmount);
        }

        require(totalDirectTokensSold <= PRESALE_DIRECT_CAP, "Direct cap exceeded");
        require(
            totalDirectTokensSold + totalReferralTokensAllocated <= TOTAL_PRESALE_CAP,
            "Presale cap exceeded"
        );
    }

    function _processReferral(
        address buyer,
        address referrer,
        uint256 buyerTokens,
        uint256 usdAmount
    ) internal {
        uint256 bonusTokens = (buyerTokens * referralBonusPercent) / BASIS_POINTS;

        if (bonusTokens == 0) {
            return;
        }

        require(
            totalReferralTokensAllocated + bonusTokens <= REFERRAL_RESERVE_CAP,
            "Referral reserve exhausted"
        );

        if (referrers[buyer] == address(0)) {
            referrers[buyer] = referrer;
            referrals[referrer].push(buyer);
        }

        referralBonuses[referrer] += bonusTokens;
        totalReferralTokensAllocated += bonusTokens;
        totalTokensAllocatedToVault += bonusTokens;

        _fundVaultAndRecordAllocation(referrer, bonusTokens, bonusTokens, 0);

        emit ReferralBonus(
            referrer,
            buyer,
            bonusTokens,
            usdAmount,
            block.timestamp
        );
    }

    function _fundVaultAndRecordAllocation(
        address user,
        uint256 totalTokens,
        uint256 immediateTokens,
        uint256 vestingTokens
    ) internal {
        require(user != address(0), "Invalid user");
        require(totalTokens > 0, "Zero allocation");
        require(totalTokens == immediateTokens + vestingTokens, "Invalid split");

        ndgToken.safeTransfer(address(vestingVault), totalTokens);

        vestingVault.recordAllocation(
            user,
            totalTokens,
            immediateTokens,
            vestingTokens
        );
    }

    function _calculateAndConsumeTokens(uint256 usdAmount)
        internal
        returns (
            uint256 totalTokens,
            uint256 finalTier
        )
    {
        uint256 remainingUSD = usdAmount;
        uint256 loops;

        while (remainingUSD > 0 && currentTier < 9 && loops < 9) {
            loops++;

            Tier storage tier = tiers[currentTier];

            if (tier.totalAvailable <= tier.sold) {
                _advanceTierIfNeeded();
                continue;
            }

            uint256 tierRemaining = tier.totalAvailable - tier.sold;
            uint256 tokensAtTierPrice = (remainingUSD * PRICE_DECIMALS) / tier.priceUSD;

            if (tokensAtTierPrice == 0) {
                break;
            }

            uint256 tokensInTier = tokensAtTierPrice > tierRemaining
                ? tierRemaining
                : tokensAtTierPrice;

            uint256 usdForTokens = (tokensInTier * tier.priceUSD) / PRICE_DECIMALS;

            if (usdForTokens > remainingUSD) {
                usdForTokens = remainingUSD;
                tokensInTier = (remainingUSD * PRICE_DECIMALS) / tier.priceUSD;
            }

            require(tokensInTier > 0, "Token calculation failed");

            tier.sold += tokensInTier;
            totalTokens += tokensInTier;
            remainingUSD -= usdForTokens;
            finalTier = currentTier;

            if (tier.sold >= tier.totalAvailable) {
                emit TierSoldOut(currentTier, tier.sold);
                _advanceTierIfNeeded();
            }

            if (remainingUSD < 1e16) {
                break;
            }
        }

        require(totalTokens > 0, "No capacity");
        require(remainingUSD < 1e16, "Insufficient tier capacity");
    }

    function checkAndAdvanceTier() external {
        _advanceTierIfNeeded();
    }

    function _advanceTierIfNeeded() internal {
        if (currentTier >= 9) {
            return;
        }

        Tier storage tier = tiers[currentTier];

        bool started = tier.startTime > 0;
        bool timeExpired = started && block.timestamp >= tier.endTime;
        bool soldOut = tier.totalAvailable > 0 && tier.sold >= tier.totalAvailable;

        if (!timeExpired && !soldOut) {
            return;
        }

        uint256 unsold = tier.totalAvailable > tier.sold
            ? tier.totalAvailable - tier.sold
            : 0;

        currentTier++;

        if (currentTier < 9) {
            tiers[currentTier].rolloverTokens += unsold;
            tiers[currentTier].totalAvailable = tiers[currentTier].baseCap + tiers[currentTier].rolloverTokens;
            tiers[currentTier].startTime = block.timestamp;
            tiers[currentTier].endTime = block.timestamp + TIER_DURATION;

            emit TierAdvanced(
                currentTier,
                tiers[currentTier].totalAvailable,
                unsold,
                soldOut ? "SOLD_OUT" : "TIME_EXPIRED"
            );
        }
    }

    function finalizePresale() external onlyOwner {
        require(!finalized, "Already finalized");
        require(
            block.timestamp >= presaleEndTime || currentTier >= 9,
            "Presale still active"
        );

        finalized = true;

        uint256 unsoldBalance = ndgToken.balanceOf(address(this));

        if (unsoldBalance > 0) {
            ndgToken.safeTransfer(treasuryWallet, unsoldBalance);
            emit UnsoldTransferredToTreasury(treasuryWallet, unsoldBalance, block.timestamp);
        }

        emit PresaleFinalized(
            totalDirectTokensSold,
            totalReferralTokensAllocated,
            unsoldBalance,
            block.timestamp
        );
    }

    function triggerTGE() external onlyOwner {
        require(!tgeTriggered, "TGE already triggered");
        require(
            finalized || currentTier >= 9 || block.timestamp >= presaleEndTime,
            "Presale not finished"
        );

        tgeTriggered = true;
        tgeTime = block.timestamp;

        emit TGETriggered(tgeTime);
    }

    function getBNBPrice() public view returns (uint256) {
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

    function previewPurchase(uint256 usdAmount)
        external
        view
        returns (
            uint256 totalTokens,
            uint256 immediateTokens,
            uint256 vestingTokens
        )
    {
        uint256 remainingUSD = usdAmount;
        uint256 tierIndex = currentTier;
        uint256 loops;

        while (remainingUSD > 0 && tierIndex < 9 && loops < 9) {
            loops++;

            Tier memory tier = tiers[tierIndex];

            uint256 tierRemaining = tier.totalAvailable > tier.sold
                ? tier.totalAvailable - tier.sold
                : 0;

            if (tierRemaining == 0) {
                tierIndex++;
                continue;
            }

            uint256 tokensAtTierPrice = (remainingUSD * PRICE_DECIMALS) / tier.priceUSD;

            if (tokensAtTierPrice == 0) {
                break;
            }

            uint256 tokensInTier = tokensAtTierPrice > tierRemaining
                ? tierRemaining
                : tokensAtTierPrice;

            uint256 usdForTokens = (tokensInTier * tier.priceUSD) / PRICE_DECIMALS;

            if (usdForTokens > remainingUSD) {
                usdForTokens = remainingUSD;
                tokensInTier = (remainingUSD * PRICE_DECIMALS) / tier.priceUSD;
            }

            totalTokens += tokensInTier;
            remainingUSD -= usdForTokens;

            if (tokensInTier >= tierRemaining) {
                tierIndex++;
            }

            if (remainingUSD < 1e16) {
                break;
            }
        }

        immediateTokens = (totalTokens * TGE_UNLOCK_PERCENT) / BASIS_POINTS;
        vestingTokens = totalTokens - immediateTokens;
    }

    function getCurrentTierInfo()
        external
        view
        returns (
            uint256 tierIndex,
            uint256 priceUSD,
            uint256 totalAvailable,
            uint256 sold,
            uint256 remaining,
            uint256 startTime,
            uint256 endTime
        )
    {
        if (currentTier >= 9) {
            return (currentTier, 0, 0, 0, 0, 0, 0);
        }

        Tier memory tier = tiers[currentTier];

        return (
            currentTier,
            tier.priceUSD,
            tier.totalAvailable,
            tier.sold,
            tier.totalAvailable > tier.sold ? tier.totalAvailable - tier.sold : 0,
            tier.startTime,
            tier.endTime
        );
    }

    function getBuyerSummary(address buyer)
        external
        view
        returns (
            uint256 totalUSD,
            uint256 totalTokens,
            uint256 immediateTokens,
            uint256 vestingTokens,
            uint256 purchaseCount
        )
    {
        BuyerSummary memory summary = buyerSummaries[buyer];

        return (
            summary.totalUSD,
            summary.totalTokens,
            summary.immediateTokens,
            summary.vestingTokens,
            summary.purchaseCount
        );
    }

    function getReferralInfo(address user)
        external
        view
        returns (
            address referrer,
            uint256 totalBonus,
            uint256 referralCount
        )
    {
        return (
            referrers[user],
            referralBonuses[user],
            referrals[user].length
        );
    }

    function getReferrals(address referrer) external view returns (address[] memory) {
        return referrals[referrer];
    }

    function getReferralReserveRemaining() external view returns (uint256) {
        return REFERRAL_RESERVE_CAP - totalReferralTokensAllocated;
    }

    function getPresaleInventoryRemaining() external view returns (uint256) {
        return ndgToken.balanceOf(address(this));
    }

    function setTreasuryWallet(address _treasuryWallet) external onlyOwner {
        require(_treasuryWallet != address(0), "Invalid treasury");

        treasuryWallet = _treasuryWallet;

        emit TreasuryWalletUpdated(_treasuryWallet);
    }

    function setStablecoin(address token, bool accepted) external onlyOwner {
        require(token != address(0), "Invalid token");

        acceptedStablecoins[token] = accepted;

        emit StablecoinUpdated(token, accepted);
    }

    function setContributionLimits(uint256 min, uint256 max) external onlyOwner {
        require(min <= max, "Invalid limits");

        minContributionUSD = min;
        maxContributionUSD = max;

        emit ContributionLimitsUpdated(min, max);
    }

    function setReferralBonusPercent(uint256 newPercent) external onlyOwner {
        require(!presaleStarted, "Presale already started");
        require(newPercent <= 2000, "Max 20%");

        referralBonusPercent = newPercent;

        emit ReferralBonusPercentUpdated(newPercent);
    }

    function setTierBaseCap(uint256 tierIndex, uint256 newBaseCap) external onlyOwner {
        require(!presaleStarted, "Presale already started");
        require(tierIndex < 9, "Invalid tier");

        tiers[tierIndex].baseCap = newBaseCap;
        tiers[tierIndex].totalAvailable = newBaseCap;
    }

    function withdrawBNB(address payable to) external onlyOwner {
        require(to != address(0), "Invalid recipient");

        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB");

        (bool success, ) = to.call{value: balance}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(address(0), to, balance);
    }

    function withdrawStablecoin(address token, address to) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(to != address(0), "Invalid recipient");

        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance");

        IERC20(token).safeTransfer(to, balance);

        emit FundsWithdrawn(token, to, balance);
    }

    function _forwardBNBToTreasury(uint256 amount) internal {
        require(amount > 0, "Zero BNB");
        require(treasuryWallet != address(0), "Treasury not set");

        (bool success, ) = payable(treasuryWallet).call{value: amount}("");
        require(success, "Treasury BNB transfer failed");

        emit FundsForwarded(address(0), treasuryWallet, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _saleActive() internal view returns (bool) {
        return (
            presaleStarted &&
            !finalized &&
            !tgeTriggered &&
            block.timestamp < presaleEndTime &&
            currentTier < 9
        );
    }

    function _getDecimals(address token) internal view returns (uint256) {
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