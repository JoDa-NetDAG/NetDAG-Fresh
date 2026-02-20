const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  const priceFeedAddress = "0x9C9DFBA325BFa8E07409D4784f71aCf45D97E900";
  
  console.log("🔍 CHECKING BNB PRICE...\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  // Get BNB price feed from presale
  const feedAddress = await presale.bnbPriceFeed();
  console.log("📍 Price Feed Address:", feedAddress);
  
  // Get price using Chainlink interface
  const AggregatorV3Interface = [
    "function latestAnswer() external view returns (int256)"
  ];
  const priceFeed = new ethers.Contract(feedAddress, AggregatorV3Interface, ethers.provider);
  
  const price = await priceFeed.latestAnswer();
  console.log("💵 Raw Price:", price.toString());
  console.log("💵 BNB Price: $" + (price / 1e8));
  
  // Calculate USD value of 0.04 BNB
  const bnbAmount = ethers.utils.parseEther("0.04");
  const usdValue = bnbAmount.mul(price).div(1e8);
  console.log("\n💰 0.04 BNB = $" + ethers.utils.formatEther(usdValue));
  
  // Check minimum
  const minUSD = await presale.minContributionUSD();
  console.log("📊 Minimum Required: $" + ethers.utils.formatEther(minUSD));
  
  if (usdValue.lt(minUSD)) {
    console.log("\n❌ BELOW MINIMUM!");
    const minBNB = minUSD.mul(1e8).div(price);
    console.log("💡 You need at least:", ethers.utils.formatEther(minBNB), "BNB");
  } else {
    console.log("\n✅ ABOVE MINIMUM!");
  }
}

main().catch(console.error);