const hre = require("hardhat");

async function main() {
  const presaleAddress = "0xc4dECFe3a1d7273049C4e86eD3Da25C335Cb0342";
  const vestingVaultAddress = "0xc60E5785c4f64EF814066581A319B67310c98C3C";
  const tokenAddress = "0xF0aA1382aac4bA2b1EFFc954eCB9Ca2112bfdC7E";
  
  const [buyer] = await ethers.getSigners();
  
  console.log("🧪 TESTING COMPLETE PRESALE FLOW\n");
  console.log("👤 Buyer:", buyer.address);
  console.log("💰 Balance:", ethers.utils.formatEther(await buyer.getBalance()), "BNB\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  const vault = await ethers.getContractAt("VestingVault", vestingVaultAddress);
  const token = await ethers.getContractAt("IERC20", tokenAddress);
  
  // 1. Purchase tokens
  console.log("1️⃣ PURCHASING TOKENS (0.1 BNB)...");
  const bnbAmount = ethers.utils.parseEther("0.1");
  const tx1 = await presale.buyWithBNB(ethers.constants.AddressZero, { value: bnbAmount });
  await tx1.wait();
  console.log("✅ Purchase successful!\n");
  
  // 2. Check allocation in presale
  const allocation = await presale.getUserAllocation(buyer.address);
  console.log("2️⃣ PRESALE ALLOCATION:");
  console.log("   Total:", ethers.utils.formatEther(allocation.totalTokens), "NDG");
  console.log("   Immediate:", ethers.utils.formatEther(allocation.immediateTokens), "NDG");
  console.log("   Vesting:", ethers.utils.formatEther(allocation.vestingTokens), "NDG\n");
  
  // 3. Check allocation in vault
  const userInfo = await vault.getUserInfo(buyer.address);
  console.log("3️⃣ VAULT ALLOCATION:");
  console.log("   Total:", ethers.utils.formatEther(userInfo.totalTokens), "NDG");
  console.log("   Immediate:", ethers.utils.formatEther(userInfo.immediateTokens), "NDG");
  console.log("   Vesting:", ethers.utils.formatEther(userInfo.vestingTokens), "NDG\n");
  
  // 4. Trigger TGE
  console.log("4️⃣ TRIGGERING TGE...");
  const tx2 = await presale.triggerTGE();
  await tx2.wait();
  console.log("✅ TGE triggered!\n");
  
  // 5. Enable TGE in vault
  console.log("5️⃣ ENABLING TGE IN VAULT...");
  const tgeTime = Math.floor(Date.now() / 1000) + 10; // 10 seconds from now
  const tx3 = await vault.enableTGE(tgeTime);
  await tx3.wait();
  console.log("✅ TGE enabled in vault!\n");
  
  // Wait for unlock time
  console.log("⏳ Waiting 15 seconds for unlock time...");
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // 6. Claim tokens
  console.log("\n6️⃣ CLAIMING IMMEDIATE TOKENS...");
  const tx4 = await vault.claimImmediate();
  await tx4.wait();
  console.log("✅ Tokens claimed!\n");
  
  // 7. Check NDG balance
  const balance = await token.balanceOf(buyer.address);
  console.log("7️⃣ FINAL NDG BALANCE:", ethers.utils.formatEther(balance), "NDG");
  
  console.log("\n🎉 COMPLETE FLOW SUCCESSFUL!");
}

main().catch(console.error);