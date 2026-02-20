const hre = require("hardhat");

async function main() {
  const ndgAddress = "0x7Cc0B687F812B74035E626E92918F2274C3083F1";
  const vaultAddress = "0x80995a285A1613F1A1F63817CC8f88AfB0aC87c3";
  
  console.log("🔧 Fixing token allocation...\n");
  
  const ndg = await ethers.getContractAt("NDGToken", ndgAddress);
  const [deployer] = await ethers.getSigners();
  
  const vaultBalance = await ndg.balanceOf(vaultAddress);
  const deployerBalance = await ndg.balanceOf(deployer.address);
  
  console.log("Current Allocation:");
  console.log("  VestingVault:", ethers.utils.formatEther(vaultBalance), "NDG");
  console.log("  Treasury:", ethers.utils.formatEther(deployerBalance), "NDG\n");
  
  console.log("Transferring 200M NDG to VestingVault...");
  const amount = ethers.utils.parseEther("200000000");
  const tx = await ndg.transfer(vaultAddress, amount);
  await tx.wait();
  console.log("✅ Transfer complete!\n");
  
  const newVaultBalance = await ndg.balanceOf(vaultAddress);
  const newDeployerBalance = await ndg.balanceOf(deployer.address);
  
  console.log("New Allocation:");
  console.log("  VestingVault:", ethers.utils.formatEther(newVaultBalance), "NDG ✅");
  console.log("  Treasury:", ethers.utils.formatEther(newDeployerBalance), "NDG ✅");
}

main().catch(console.error);