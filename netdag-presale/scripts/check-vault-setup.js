const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  const vestingVaultAddress = "0x0aC817497d482629879d9c44fF226C033c5f64D4";
  
  console.log("🔍 CHECKING VAULT SETUP...\n");
  
  const vault = await ethers.getContractAt("VestingVault", vestingVaultAddress);
  
  // Check presale contract
  const presaleContract = await vault.presaleContract();
  console.log("📋 Presale Contract in Vault:", presaleContract);
  console.log("📋 Actual Presale Contract:", presaleAddress);
  
  if (presaleContract.toLowerCase() === presaleAddress.toLowerCase()) {
    console.log("\n✅ Presale is connected!");
  } else {
    console.log("\n❌ PRESALE NOT CONNECTED!");
    console.log("\n💡 Need to call setPresaleContract()");
  }
  
  // Check user's purchase in presale
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  const [buyer] = await ethers.getSigners();
  
  const allocation = await presale.getUserAllocation(buyer.address);
  console.log("\n📊 YOUR PURCHASE IN PRESALE:");
  console.log("   Total:", ethers.utils.formatEther(allocation.totalTokens), "NDG");
  console.log("   Immediate:", ethers.utils.formatEther(allocation.immediateTokens), "NDG");
}

main().catch(console.error);