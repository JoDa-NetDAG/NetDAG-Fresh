const hre = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log("🔑 ACTIVE WALLET:");
  console.log("   Address:", address);
  console.log("   Balance:", ethers.utils.formatEther(balance), "BNB");
  
  console.log("\n📊 TARGET WALLET:");
  console.log("   Address: 0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B");
  console.log("   Balance: 0.64 BNB");
  
  if (address.toLowerCase() === "0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B".toLowerCase()) {
    console.log("\n✅ CORRECT WALLET!");
  } else {
    console.log("\n❌ WRONG WALLET - UPDATE YOUR .ENV FILE!");
  }
}

main().catch(console.error);