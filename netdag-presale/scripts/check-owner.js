const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  
  console.log("🔍 CHECKING CONTRACT OWNER...\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  const owner = await presale.owner();
  console.log("👑 Owner:", owner);
  
  const [signer] = await ethers.getSigners();
  console.log("👤 Your Address:", signer.address);
  
  if (owner.toLowerCase() === signer.address.toLowerCase()) {
    console.log("\n✅ YOU ARE THE OWNER!");
  } else {
    console.log("\n❌ YOU ARE NOT THE OWNER!");
    console.log("\n💡 You need to use the deployer wallet to trigger TGE.");
  }
}

main().catch(console.error);