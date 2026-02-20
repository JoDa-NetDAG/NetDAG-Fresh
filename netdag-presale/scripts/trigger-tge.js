const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  
  console.log("🚀 TRIGGERING TGE (Token Generation Event)...\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  const tx = await presale.triggerTGE();
  await tx.wait();
  
  console.log("✅ TGE TRIGGERED!");
  console.log("🎉 Immediate tokens are now claimable!");
}

main().catch(console.error);