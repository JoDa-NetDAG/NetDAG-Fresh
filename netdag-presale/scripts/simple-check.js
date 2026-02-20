const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  const ndgAddress = "0x7Cc0B687F812B74035E626E92918F2274C3083F1";
  const vaultAddress = "0x80995a285A1613F1A1F63817CC8f88AfB0aC87c3";
  
  console.log("🔍 PRESALE STATUS\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  const ndg = await ethers.getContractAt("NDGToken", ndgAddress);
  
  // Current tier
  const currentTier = await presale.currentTier();
  console.log("📍 Current Tier:", currentTier.toString(), "of 9");
  
  // Get current tier details
  const tier = await presale.tiers(currentTier);
  console.log("\n💰 CURRENT TIER INFO:");
  console.log("   Price: $" + ethers.utils.formatUnits(tier.price, 18), "per NDG");
  console.log("   Base Cap:", ethers.utils.formatEther(tier.baseCap), "NDG");
  console.log("   Total Available:", ethers.utils.formatEther(tier.totalAvailable), "NDG");
  console.log("   Sold:", ethers.utils.formatEther(tier.sold), "NDG");
  console.log("   Remaining:", ethers.utils.formatEther(tier.totalAvailable.sub(tier.sold)), "NDG");
  
  // Vault balance
  const vaultBalance = await ndg.balanceOf(vaultAddress);
  console.log("\n📦 Vault Balance:", ethers.utils.formatEther(vaultBalance), "NDG");
  
  // Presale active?
  const paused = await presale.paused();
  console.log("🚦 Status:", paused ? "❌ PAUSED" : "✅ ACTIVE");
  
  console.log("\n✅ Ready for testing!");
}

main().catch(console.error);