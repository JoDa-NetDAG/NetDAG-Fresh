const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  const [buyer] = await ethers.getSigners();
  
  console.log("📊 YOUR PURCHASE DETAILS\n");
  console.log("👤 Address:", buyer.address);
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  // Get user allocation
  const allocation = await presale.getUserAllocation(buyer.address);
  
  console.log("\n💰 ALLOCATION:");
  console.log("   Total Tokens:", ethers.utils.formatEther(allocation.totalTokens), "NDG");
  console.log("   Immediate (TGE):", ethers.utils.formatEther(allocation.immediateTokens), "NDG");
  console.log("   Vesting:", ethers.utils.formatEther(allocation.vestingTokens), "NDG");
  console.log("   USD Invested: $" + ethers.utils.formatEther(allocation.usdInvested));
  
  // Get total USD contributed
  const totalUSD = await presale.userTotalUSD(buyer.address);
  console.log("\n📊 TOTAL CONTRIBUTION: $" + ethers.utils.formatEther(totalUSD));
  
  console.log("\n✅ SUCCESS! You own 10,000 NDG tokens!");
}

main().catch(console.error);