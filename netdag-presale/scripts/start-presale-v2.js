const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Starting Presale v2.0 with Referral System...\n");

    // Load deployment info
    const deploymentFile = "deployment-with-referrals.json";
    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ Error: deployment-with-referrals.json not found!");
        console.log("Please run deploy-with-referrals.js first.");
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("Loaded deployment from:", deploymentFile);
    console.log("Network:", deployment.network);
    console.log("Presale Contract:", deployment.contracts.PresaleWithVesting, "\n");

    // Get signer
    const [owner] = await hre.ethers.getSigners();
    console.log("Owner:", owner.address, "\n");

    // Get presale contract
    const presale = await hre.ethers.getContractAt(
        "PresaleWithVesting",
        deployment.contracts.PresaleWithVesting
    );

    // Check if already started
    const presaleStartTime = await presale.presaleStartTime();
    if (presaleStartTime.gt(0)) {
        console.log("⚠️  Presale already started at:", new Date(presaleStartTime * 1000).toISOString());
        const currentTier = await presale.currentTier();
        const totalRaised = await presale.totalRaisedUSD();
        const totalAllocated = await presale.totalTokensAllocated();
        
        console.log("\n📊 Current Status:");
        console.log("  Current Tier:", currentTier.toString());
        console.log("  Total Raised:", hre.ethers.utils.formatEther(totalRaised), "USD");
        console.log("  Total Allocated:", hre.ethers.utils.formatEther(totalAllocated), "NDG");
        
        return;
    }

    // Start presale
    console.log("🎬 Starting presale...");
    const tx = await presale.startPresale();
    await tx.wait();
    console.log("✅ Transaction confirmed:", tx.hash, "\n");

    // Get presale info
    const startTime = await presale.presaleStartTime();
    const endTime = await presale.presaleEndTime();
    const referralBonus = await presale.referralBonusPercent();

    console.log("═══════════════════════════════════════════════════");
    console.log("✅ Presale Started Successfully!");
    console.log("═══════════════════════════════════════════════════");
    console.log("Start Time:", new Date(startTime * 1000).toISOString());
    console.log("End Time:", new Date(endTime * 1000).toISOString());
    console.log("Duration: 9 months (270 days)");
    console.log("");
    console.log("Referral System:");
    console.log("  Status: ENABLED");
    console.log("  Bonus:", referralBonus.toString(), "basis points (", referralBonus / 100, "%)");
    console.log("");
    console.log("Current Tier: 0 (Tier 1)");
    console.log("Tier 1 Price: $0.006 per NDG");
    console.log("Tier 1 Allocation: 108,000,000 NDG");
    console.log("");
    console.log("Next Steps:");
    console.log("  - Test referral system with test-referral-system.js");
    console.log("  - Make test purchases to validate bonuses");
    console.log("  - Check tier progression");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
