// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
    function decimals() external view returns (uint8);
}

contract Presale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Tier {
        uint256 priceUsd18;   // USD price per NDG (18 decimals)
        uint256 capUsd18;     // USD cap for this tier (18 decimals)
        uint256 soldUsd18;    // USD sold in this tier (18 decimals)
    }

    IERC20 public immutable ndgToken;
    AggregatorV3Interface public priceFeed;
    bool public paused;

    Tier[] public tiers;
    mapping(address => bool) public acceptedStable;
    address[] public stableList;
    mapping(address => uint256) public contributionUsd18;

    uint256 public minContributionUsd18;
    uint256 public maxContributionUsd18;
    uint256 public totalSoldUsd18;

    event Purchased(address indexed buyer, address indexed payToken, uint256 payAmount, uint256 ndgAmount, uint256 usdValue18, uint256 timestamp);
    event TierAdded(uint256 indexed tierIndex, uint256 priceUsd18, uint256 capUsd18);
    event PriceFeedChanged(address indexed aggregator);
    event StablecoinToggled(address indexed token, bool accepted);
    event Withdrawn(address indexed to, address indexed token, uint256 amount);
    event Paused(bool paused);

    constructor(address _ndgToken, address _priceFeed, uint256 _minUsd18, uint256 _maxUsd18) {
        require(_ndgToken != address(0), "NDG zero");
        ndgToken = IERC20(_ndgToken);
        priceFeed = AggregatorV3Interface(_priceFeed);
        minContributionUsd18 = _minUsd18;
        maxContributionUsd18 = _maxUsd18;
    }

    modifier whenNotPaused() {
      require(!paused, "paused");
      _;
    }

    // -----------------------
    // OWNER ADMIN FUNCTIONS
    // -----------------------

    function addTier(uint256 priceUsd18, uint256 capUsd18) external onlyOwner {
        require(priceUsd18 > 0, "price 0");
        tiers.push(Tier({ priceUsd18: priceUsd18, capUsd18: capUsd18, soldUsd18: 0 }));
        emit TierAdded(tiers.length - 1, priceUsd18, capUsd18);
    }

    function setTiers(uint256[] calldata pricesUsd18, uint256[] calldata capsUsd18) external onlyOwner {
        require(pricesUsd18.length == capsUsd18.length, "length mismatch");
        delete tiers;
        for (uint i = 0; i < pricesUsd18.length; i++) {
            tiers.push(Tier({ priceUsd18: pricesUsd18[i], capUsd18: capsUsd18[i], soldUsd18: 0 }));
            emit TierAdded(i, pricesUsd18[i], capsUsd18[i]);
        }
    }

    function setPriceFeed(address aggregator) external onlyOwner {
        priceFeed = AggregatorV3Interface(aggregator);
        emit PriceFeedChanged(aggregator);
    }

    function toggleStablecoin(address token, bool accept) external onlyOwner {
        if (accept && !acceptedStable[token]) {
            acceptedStable[token] = true;
            stableList.push(token);
        } else if (!accept && acceptedStable[token]) {
            acceptedStable[token] = false;
        }
        emit StablecoinToggled(token, accept);
    }

    function setContributionLimits(uint256 minUsd18, uint256 maxUsd18) external onlyOwner {
        minContributionUsd18 = minUsd18;
        maxContributionUsd18 = maxUsd18;
    }

    function pauseSale(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to zero");
        if (token == address(0)) {
            (bool sent, ) = payable(to).call{ value: amount }("");
            require(sent, "BNB transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        emit Withdrawn(to, token, amount);
    }

    // -----------------------
    // VIEW HELPERS
    // -----------------------

    function tiersCount() external view returns (uint256) { return tiers.length; }

    function _getLatestBNBPrice() internal view returns (uint256 price, uint8 decimals) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        require(answer > 0, "invalid oracle answer");
        decimals = priceFeed.decimals();
        price = uint256(answer);
    }

    function _bnbToUsd18(uint256 amountWei) internal view returns (uint256) {
        (uint256 price, uint8 dec) = _getLatestBNBPrice();
        uint256 price18 = price * (10 ** (18 - dec));
        return (amountWei * price18) / 1e18;
    }

    function _stableToUsd18(uint256 amountToken) internal pure returns (uint256) {
        // assume stable has 18 decimals and 1 token = $1
        return amountToken;
    }

    function _usd18ToNdgUnits(uint256 usd18, uint256 priceUsd18) internal pure returns (uint256) {
        return (usd18 * 1e18) / priceUsd18;
    }

    // -----------------------
    // PURCHASE FLOW
    // -----------------------

    // internal core used by both external buyWithBNB and receive()
    function _buyWithBNB(address buyer, uint256 amount) internal nonReentrant whenNotPaused {
        require(amount > 0, "zero BNB");
        uint256 usd18 = _bnbToUsd18(amount);
        _processPurchase(buyer, address(0), amount, usd18);
    }

    function buyWithBNB() external payable {
        _buyWithBNB(msg.sender, msg.value);
    }

    receive() external payable {
        _buyWithBNB(msg.sender, msg.value);
    }

    function buyWithToken(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "zero amount");
        require(acceptedStable[token], "token not accepted");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 usd18 = _stableToUsd18(amount);
        _processPurchase(msg.sender, token, amount, usd18);
    }

    function _processPurchase(address buyer, address payToken, uint256 payAmount, uint256 usd18) internal {
        require(tiers.length > 0, "no tiers");
        require(usd18 > 0, "zero USD");

        uint256 newUserTotal = contributionUsd18[buyer] + usd18;
        require(newUserTotal >= minContributionUsd18, "below min");
        require(newUserTotal <= maxContributionUsd18, "above max");

        uint256 remainingUsd = usd18;
        uint256 totalNdgUnits = 0;

        for (uint i = 0; i < tiers.length && remainingUsd > 0; i++) {
            Tier storage t = tiers[i];
            uint256 tierRemaining = 0;
            if (t.capUsd18 > t.soldUsd18) tierRemaining = t.capUsd18 - t.soldUsd18;
            if (tierRemaining == 0) continue;

            uint256 usdInThisTier = remainingUsd <= tierRemaining ? remainingUsd : tierRemaining;
            uint256 ndgUnits = _usd18ToNdgUnits(usdInThisTier, t.priceUsd18);
            totalNdgUnits += ndgUnits;

            t.soldUsd18 += usdInThisTier;
            remainingUsd -= usdInThisTier;
            totalSoldUsd18 += usdInThisTier;
        }

        require(remainingUsd == 0, "exceeds total cap");

        uint256 presaleBalance = ndgToken.balanceOf(address(this));
        require(presaleBalance >= totalNdgUnits, "insufficient NDG");

        contributionUsd18[buyer] += usd18;

        ndgToken.safeTransfer(buyer, totalNdgUnits);

        emit Purchased(buyer, payToken, payAmount, totalNdgUnits, usd18, block.timestamp);
    }

    function totalRemainingUsd18() external view returns (uint256 rem) {
        for (uint i = 0; i < tiers.length; i++) {
            if (tiers[i].capUsd18 > tiers[i].soldUsd18) {
                rem += (tiers[i].capUsd18 - tiers[i].soldUsd18);
            }
        }
    }

    function getStableList() external view returns (address[] memory) { return stableList; }

    function getTier(uint256 idx) external view returns (uint256 priceUsd18, uint256 capUsd18, uint256 soldUsd18) {
        require(idx < tiers.length, "idx");
        Tier storage t = tiers[idx];
        return (t.priceUsd18, t.capUsd18, t.soldUsd18);
    }
}