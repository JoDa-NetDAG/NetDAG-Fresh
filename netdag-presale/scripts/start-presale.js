const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  
  console.log("🚀 STARTING PRESALE...\n");
  
  const [owner] = await ethers.getSigners();
  console.log("👤 Owner:", owner.address);
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  // Check current start time
  const startTime = await presale.presaleStartTime();
  console.log("Current Start Time:", startTime.toString());
  
  if (startTime.toString() !== "0") {
    console.log("✅ Presale already started!");
    console.log("📅 Started at:", new Date(startTime * 1000).toLocaleString());
    return;
  }
  
  // Start the presale
  console.log("\n🎬 Calling startPresale()...");
  const tx = await presale.startPresale();
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  console.log("✅ Presale started!");
  console.log("📝 Tx hash:", tx.hash);
  
  // Verify
  const newStartTime = await presale.presaleStartTime();
  console.log("\n📅 New Start Time:", new Date(newStartTime * 1000).toLocaleString());
  
  // Show tier info
  const currentTier = await presale.currentTier();
  const tier = await presale.tiers(currentTier);
  console.log("\n💰 TIER INFO:");
  console.log("   Current Tier:", currentTier.toString());
  console.log("   Price: $" + ethers.utils.formatUnits(tier.price, 18), "per NDG");
  console.log("   Available:", ethers.utils.formatEther(tier.totalAvailable), "NDG");
  
  console.log("\n✅ Ready for purchases!");
}

main().catch(console.error);