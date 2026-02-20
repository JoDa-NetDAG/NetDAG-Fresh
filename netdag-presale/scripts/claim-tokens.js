const hre = require("hardhat");

async function main() {
  const vestingVaultAddress = "0x0aC817497d482629879d9c44fF226C033c5f64D4";
  const [claimer] = await ethers.getSigners();
  
  console.log("💰 CLAIMING YOUR TOKENS...\n");
  console.log("👤 Address:", claimer.address);
  
  const vault = await ethers.getContractAt("VestingVault", vestingVaultAddress);
  
  // Get user info
  const userInfo = await vault.getUserInfo(claimer.address);
  console.log("\n📊 YOUR ALLOCATION:");
  console.log("   Total:", ethers.utils.formatEther(userInfo.totalTokens), "NDG");
  console.log("   Immediate:", ethers.utils.formatEther(userInfo.immediateTokens), "NDG");
  console.log("   Vesting:", ethers.utils.formatEther(userInfo.vestingTokens), "NDG");
  console.log("   Already Claimed:", ethers.utils.formatEther(userInfo.claimedImmediate), "NDG");
  console.log("   Immediate Claimed?", userInfo.immediateClaimed);
  
  // Claim immediate tokens
  if (!userInfo.immediateClaimed && userInfo.immediateTokens.gt(0)) {
    console.log("\n🚀 Claiming immediate tokens...");
    const tx = await vault.claimImmediate();
    await tx.wait();
    
    console.log("✅ IMMEDIATE TOKENS CLAIMED!");
    console.log("📝 Tx hash:", tx.hash);
    
    // Check NDG balance
    const tokenAddress = "0xf8E886791E26DFD9195C1225b4Ca6458725DAe50";
    const token = await ethers.getContractAt("IERC20", tokenAddress);
    const balance = await token.balanceOf(claimer.address);
    
    console.log("\n💰 YOUR NDG BALANCE:", ethers.utils.formatEther(balance), "NDG");
  } else {
    console.log("\n✅ Immediate tokens already claimed or none available!");
  }
}

main().catch(console.error);