const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  const newOwner = "0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B";
  
  console.log("🔄 TRANSFERRING OWNERSHIP...\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  const tx = await presale.transferOwnership(newOwner);
  await tx.wait();
  
  console.log("✅ OWNERSHIP TRANSFERRED!");
  console.log("👑 New Owner:", newOwner);
}

main().catch(console.error);