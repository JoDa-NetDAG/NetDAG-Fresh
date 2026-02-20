const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🧪 Testing Presale Statistics Queries...\n");

    // Load deployment info
    const deploymentFile = "deployment-with-referrals.json";
    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ Error: deployment-with-referrals.json not found!");
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("Network:", deployment.network);
    console.log("Presale:", deployment.contracts.PresaleWithVesting, "\n");

    // Get contracts
    const presale = await hre.ethers.getContractAt(
        "PresaleWithVesting",
        deployment.contracts.PresaleWithVesting
    );

    // ==================== TEST 1: Presale Status ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 1: Presale Status");
    console.log("═══════════════════════════════════════════════════\n");

    const startTime = await presale.presaleStartTime();
    const endTime = await presale.presaleEndTime();
    const tgeTriggered = await presale.tgeTriggered();
    const finalized = await presale.finalized();
    
    console.log("Presale Status:");
    console.log("  Started:", startTime.gt(0) ? "Yes" : "No");
    if (startTime.gt(0)) {
        console.log("  Start Time:", new Date(startTime * 1000).toISOString());
        console.log("  End Time:", new Date(endTime * 1000).toISOString());
    }
    console.log("  TGE Triggered:", tgeTriggered ? "Yes" : "No");
    console.log("  Finalized:", finalized ? "Yes" : "No");
    console.log("");

    // ==================== TEST 2: Financial Statistics ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 2: Financial Statistics");
    console.log("═══════════════════════════════════════════════════\n");

    const totalRaised = await presale.totalRaisedUSD();
    const totalAllocated = await presale.totalTokensAllocated();
    const minContribution = await presale.minContributionUSD();
    const maxContribution = await presale.maxContributionUSD();
    
    console.log("Financial Statistics:");
    console.log("  Total Raised:", hre.ethers.utils.formatEther(totalRaised), "USD");
    console.log("  Total Allocated:", hre.ethers.utils.formatEther(totalAllocated), "NDG");
    console.log("  Min Contribution:", hre.ethers.utils.formatEther(minContribution), "USD");
    console.log("  Max Contribution:", hre.ethers.utils.formatEther(maxContribution), "USD");
    console.log("");

    // ==================== TEST 3: Current Tier Information ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 3: Current Tier Information");
    console.log("═══════════════════════════════════════════════════\n");

    const currentTier = await presale.currentTier();
    const tierInfo = await presale.getCurrentTierInfo();
    
    console.log("Current Tier:", currentTier.toString(), `(Tier ${currentTier.toNumber() + 1})`);
    console.log("Tier Details:");
    console.log("  Price:", hre.ethers.utils.formatEther(tierInfo.price), "USD per NDG");
    console.log("  Total Available:", hre.ethers.utils.formatEther(tierInfo.totalAvailable), "NDG");
    console.log("  Sold:", hre.ethers.utils.formatEther(tierInfo.sold), "NDG");
    console.log("  Remaining:", hre.ethers.utils.formatEther(tierInfo.totalAvailable.sub(tierInfo.sold)), "NDG");
    console.log("  Progress:", (tierInfo.sold.mul(10000).div(tierInfo.totalAvailable).toNumber() / 100).toFixed(2), "%");
    console.log("");

    // ==================== TEST 4: All Tiers Overview ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 4: All Tiers Overview");
    console.log("═══════════════════════════════════════════════════\n");

    console.log("Tier | Price    | Allocation   | Sold         | Progress");
    console.log("-----|----------|--------------|--------------|----------");
    
    let totalSold = hre.ethers.BigNumber.from(0);
    let totalAvailable = hre.ethers.BigNumber.from(0);
    
    for (let i = 0; i < 9; i++) {
        const tier = await presale.tiers(i);
        const sold = parseFloat(hre.ethers.utils.formatEther(tier.sold));
        const available = parseFloat(hre.ethers.utils.formatEther(tier.totalAvailable));
        const progress = available > 0 ? ((sold / available) * 100).toFixed(1) : "0.0";
        
        totalSold = totalSold.add(tier.sold);
        totalAvailable = totalAvailable.add(tier.totalAvailable);
        
        console.log(
            `${(i + 1).toString().padStart(4)} |`,
            `$${hre.ethers.utils.formatEther(tier.price).padStart(7)} |`,
            `${available.toFixed(0).padStart(11)}M |`,
            `${sold.toFixed(0).padStart(11)}M |`,
            `${progress.padStart(6)}%`
        );
    }
    
    const overallProgress = (parseFloat(hre.ethers.utils.formatEther(totalSold)) / 
                             parseFloat(hre.ethers.utils.formatEther(totalAvailable)) * 100).toFixed(2);
    
    console.log("");
    console.log("Overall Progress:");
    console.log("  Total Available:", hre.ethers.utils.formatEther(totalAvailable), "NDG");
    console.log("  Total Sold:", hre.ethers.utils.formatEther(totalSold), "NDG");
    console.log("  Progress:", overallProgress, "%");
    console.log("");

    // ==================== TEST 5: Referral System Statistics ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 5: Referral System Statistics");
    console.log("═══════════════════════════════════════════════════\n");

    const referralBonus = await presale.referralBonusPercent();
    
    console.log("Referral System:");
    console.log("  Status: ENABLED");
    console.log("  Bonus Rate:", referralBonus.toString(), "basis points (", referralBonus / 100, "%)");
    console.log("");

    // Check a few test accounts for referral data
    const accounts = await hre.ethers.getSigners();
    let totalBonuses = hre.ethers.BigNumber.from(0);
    let referrerCount = 0;
    
    console.log("Referral Activity:");
    for (let i = 0; i < Math.min(5, accounts.length); i++) {
        const info = await presale.getReferralInfo(accounts[i].address);
        if (info.totalBonus.gt(0)) {
            referrerCount++;
            totalBonuses = totalBonuses.add(info.totalBonus);
            console.log(`  ${accounts[i].address}:`);
            console.log(`    Referrals: ${info.referralCount.toString()}`);
            console.log(`    Bonuses: ${hre.ethers.utils.formatEther(info.totalBonus)} NDG`);
        }
    }
    
    if (referrerCount === 0) {
        console.log("  No referral bonuses earned yet");
    } else {
        console.log("");
        console.log("Total Referral Bonuses:", hre.ethers.utils.formatEther(totalBonuses), "NDG");
    }
    console.log("");

    // ==================== TEST 6: Token Price Feed ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 6: Token Price Feed");
    console.log("═══════════════════════════════════════════════════\n");

    const bnbPrice = await presale.getBNBPrice();
    console.log("BNB Price:", hre.ethers.utils.formatEther(bnbPrice), "USD");
    
    // Calculate how much BNB needed for $100
    const usd100 = hre.ethers.utils.parseEther("100");
    const bnbFor100 = usd100.mul(hre.ethers.utils.parseEther("1")).div(bnbPrice);
    console.log("BNB for $100:", hre.ethers.utils.formatEther(bnbFor100), "BNB");
    console.log("");

    // ==================== SUMMARY ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ Presale Statistics Tests Complete!");
    console.log("═══════════════════════════════════════════════════");
    
    console.log("\nKey Metrics:");
    console.log("  Total Raised:", hre.ethers.utils.formatEther(totalRaised), "USD");
    console.log("  Total Allocated:", hre.ethers.utils.formatEther(totalAllocated), "NDG");
    console.log("  Current Tier:", currentTier.toString());
    console.log("  Overall Progress:", overallProgress, "%");
    console.log("  Referral Bonuses:", hre.ethers.utils.formatEther(totalBonuses), "NDG");
    console.log("");
    console.log("All Tests:");
    console.log("  ✅ Presale status queries");
    console.log("  ✅ Financial statistics");
    console.log("  ✅ Current tier information");
    console.log("  ✅ All tiers overview");
    console.log("  ✅ Referral system statistics");
    console.log("  ✅ Token price feed");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
