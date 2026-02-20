const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  
  console.log("🛒 TESTING PRESALE PURCHASE\n");
  
  const [buyer] = await ethers.getSigners();
  console.log("👤 Buyer:", buyer.address);
  
  const balance = await ethers.provider.getBalance(buyer.address);
  console.log("💰 BNB Balance:", ethers.utils.formatEther(balance), "BNB");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  // Get current state
  const currentTier = await presale.currentTier();
  const tier = await presale.tiers(currentTier);
  console.log("\n📊 BEFORE PURCHASE:");
  console.log("   Current Tier:", currentTier.toString());
  console.log("   Tier Price: $" + ethers.utils.formatUnits(tier.price, 18));
  console.log("   Tier Sold:", ethers.utils.formatEther(tier.sold), "NDG");
  
  // Purchase amount: 0.1 BNB = $60 (above $50 minimum)
  const bnbAmount = ethers.utils.parseEther("0.1");
  console.log("\n💰 Purchasing with:", ethers.utils.formatEther(bnbAmount), "BNB (~$60)");
  
  // Execute purchase
  console.log("\n🚀 Executing purchase...");
  const tx = await presale.buyWithBNB(ethers.constants.AddressZero, { value: bnbAmount });
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("✅ Purchase successful!");
  console.log("📝 Tx hash:", tx.hash);
  
  // Get updated state
  const newTier = await presale.tiers(currentTier);
  console.log("\n📊 AFTER PURCHASE:");
  console.log("   Tier Sold:", ethers.utils.formatEther(newTier.sold), "NDG");
  
  // Get buyer info
  const contribution = await presale.contributions(buyer.address);
  console.log("\n👤 YOUR CONTRIBUTION:");
  console.log("   Total USD:", ethers.utils.formatEther(contribution.totalUSD));
  console.log("   Total Tokens:", ethers.utils.formatEther(contribution.totalTokens), "NDG");
  
  console.log("\n✅ TEST COMPLETE!");
}

main().catch(console.error);