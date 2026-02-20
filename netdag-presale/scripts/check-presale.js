const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  const vaultAddress = "0x80995a285A1613F1A1F63817CC8f88AfB0aC87c3";
  const ndgAddress = "0x7Cc0B687F812B74035E626E92918F2274C3083F1";
  
  console.log("🔍 Checking Presale Status...\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  const vault = await ethers.getContractAt("VestingVault", vaultAddress);
  const ndg = await ethers.getContractAt("NDGToken", ndgAddress);
  
  // Check current tier
  const currentTier = await presale.currentTier();
  console.log("📍 Current Tier:", currentTier.toString());
  
  // Get tier details (tiers 0-4)
  console.log("\n💰 PRESALE TIERS:\n");
  for (let i = 0; i <= 4; i++) {
    try {
      const tier = await presale.tiers(i);
      const isCurrent = i == currentTier;
      console.log(`${isCurrent ? '👉' : '  '} Tier ${i}:`);
      console.log(`   Price: $${ethers.utils.formatUnits(tier.price, 18)} per NDG`);
      console.log(`   Tokens Available: ${ethers.utils.formatEther(tier.allocation)} NDG`);
      console.log(`   Tokens Sold: ${ethers.utils.formatEther(tier.sold)} NDG`);
      console.log(`   Min Purchase: $${ethers.utils.formatEther(tier.minPurchase)}`);
      console.log(`   Max Purchase: $${ethers.utils.formatEther(tier.maxPurchase)}\n`);
    } catch (e) {
      console.log(`   Error reading tier ${i}:`, e.message);
    }
  }
  
  // Check vault balance
  const vaultBalance = await ndg.balanceOf(vaultAddress);
  console.log("📦 VestingVault NDG Balance:", ethers.utils.formatEther(vaultBalance), "NDG");
  
  // Check if presale is active
  const paused = await presale.paused();
  console.log("🚦 Presale Status:", paused ? "❌ PAUSED" : "✅ ACTIVE");
  
  // Total raised
  const totalRaised = await presale.totalUSDRaised();
  console.log("💵 Total USD Raised: $" + ethers.utils.formatEther(totalRaised));
}

main().catch(console.error);