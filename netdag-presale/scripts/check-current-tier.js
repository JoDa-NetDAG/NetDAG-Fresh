const hre = require("hardhat");

async function main() {
  const presaleAddress = "0xc4dECFe3a1d7273049C4e86eD3Da25C335Cb0342";
  
  console.log("🔍 CHECKING CURRENT TIER & HARDCAP...\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  // Get current tier info
  const tierInfo = await presale.getCurrentTierInfo();
  
  console.log("📊 CURRENT TIER:");
  console.log("   Tier Index:", tierInfo.tierIndex.toString());
  console.log("   Price:", ethers.utils.formatEther(tierInfo.price), "USD");
  console.log("   Total Available:", ethers.utils.formatEther(tierInfo.totalAvailable), "NDG");
  console.log("   Sold:", ethers.utils.formatEther(tierInfo.sold), "NDG");
  console.log("   Remaining:", ethers.utils.formatEther(tierInfo.remaining), "NDG");
  
  // Calculate hardcap (all 9 tiers)
  console.log("\n💰 HARDCAP CALCULATION (All Tiers):\n");
  
  const tiers = [
    { tier: 1, price: 0.006, tokens: 108000000 },
    { tier: 2, price: 0.009, tokens: 96000000 },
    { tier: 3, price: 0.013, tokens: 84000000 },
    { tier: 4, price: 0.017, tokens: 72000000 },
    { tier: 5, price: 0.021, tokens: 60000000 },
    { tier: 6, price: 0.025, tokens: 60000000 },
    { tier: 7, price: 0.028, tokens: 48000000 },
    { tier: 8, price: 0.12, tokens: 42000000 },
    { tier: 9, price: 0.16, tokens: 30000000 }
  ];
  
  let totalRaise = 0;
  let totalTokens = 0;
  
  tiers.forEach(t => {
    const raise = t.tokens * t.price;
    totalRaise += raise;
    totalTokens += t.tokens;
    console.log(`   Tier ${t.tier}: ${t.tokens.toLocaleString()} NDG × $${t.price} = $${raise.toLocaleString()}`);
  });
  
  console.log("\n" + "=".repeat(60));
  console.log(`   💎 TOTAL TOKENS: ${totalTokens.toLocaleString()} NDG`);
  console.log(`   💰 HARDCAP: $${totalRaise.toLocaleString()} USD`);
  console.log("=".repeat(60));
  
  // Get total raised so far
  const totalRaisedUSD = await presale.totalRaisedUSD();
  console.log("\n📈 CURRENT PROGRESS:");
  console.log("   Raised So Far: $" + ethers.utils.formatEther(totalRaisedUSD));
  console.log("   Percentage: " + ((parseFloat(ethers.utils.formatEther(totalRaisedUSD)) / totalRaise) * 100).toFixed(4) + "%");
}

main().catch(console.error);