const hre = require("hardhat");

async function main() {
  const ndgAddress = "0x7Cc0B687F812B74035E626E92918F2274C3083F1";
  const vaultAddress = "0x80995a285A1613F1A1F63817CC8f88AfB0aC87c3";
  
  console.log("Checking VestingVault balance...");
  const ndg = await ethers.getContractAt("NDGToken", ndgAddress);
  
  const balance = await ndg.balanceOf(vaultAddress);
  console.log("Current balance:", ethers.utils.formatEther(balance), "NDG");
  
  if (balance.eq(0)) {
    console.log("\nTransferring 400M NDG to VestingVault...");
    const amount = ethers.utils.parseEther("400000000");
    const tx = await ndg.transfer(vaultAddress, amount);
    await tx.wait();
    console.log("✅ Transfer complete!");
    
    const newBalance = await ndg.balanceOf(vaultAddress);
    console.log("New balance:", ethers.utils.formatEther(newBalance), "NDG");
  } else {
    console.log("✅ Vault already has tokens!");
  }
}

main().catch(console.error);