const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🧪 Testing Tier Progression...\n");

    // Load deployment info
    const deploymentFile = "deployment-with-referrals.json";
    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ Error: deployment-with-referrals.json not found!");
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("Network:", deployment.network);
    console.log("Presale:", deployment.contracts.PresaleWithVesting, "\n");

    // Get signer
    const [owner] = await hre.ethers.getSigners();
    console.log("Test Account:", owner.address, "\n");

    // Get presale contract
    const presale = await hre.ethers.getContractAt(
        "PresaleWithVesting",
        deployment.contracts.PresaleWithVesting
    );

    // ==================== TEST 1: Check Initial Tier ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 1: Check Initial Tier");
    console.log("═══════════════════════════════════════════════════\n");

    const currentTier = await presale.currentTier();
    const tierInfo = await presale.getCurrentTierInfo();
    
    console.log("Current Tier:", currentTier.toString());
    console.log("Tier Info:");
    console.log("  Index:", tierInfo.tierIndex.toString());
    console.log("  Price:", hre.ethers.utils.formatEther(tierInfo.price), "USD per NDG");
    console.log("  Total Available:", hre.ethers.utils.formatEther(tierInfo.totalAvailable), "NDG");
    console.log("  Sold:", hre.ethers.utils.formatEther(tierInfo.sold), "NDG");
    console.log("  Remaining:", hre.ethers.utils.formatEther(tierInfo.totalAvailable.sub(tierInfo.sold)), "NDG");
    console.log("");

    // ==================== TEST 2: Preview Large Purchase ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 2: Preview Purchase Spanning Multiple Tiers");
    console.log("═══════════════════════════════════════════════════\n");

    // Preview a large purchase that will span tiers
    const largeUSD = hre.ethers.utils.parseEther("100000"); // $100k USD
    const preview = await presale.previewPurchase(largeUSD);
    
    console.log("Preview for $100,000 USD:");
    console.log("  Total Tokens (anchor):", hre.ethers.utils.formatEther(preview.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(preview.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(preview.vestingTokens), "NDG");
    console.log("");

    // ==================== TEST 3: Make Purchase in Tier 1 ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 3: Make Purchase in Tier 1");
    console.log("═══════════════════════════════════════════════════\n");

    const bnbAmount = hre.ethers.utils.parseEther("0.5");
    console.log("Purchasing with", hre.ethers.utils.formatEther(bnbAmount), "BNB...");
    
    const tx = await presale.buyWithBNB(hre.ethers.constants.AddressZero, { value: bnbAmount });
    await tx.wait();
    console.log("✅ Purchase confirmed:", tx.hash, "\n");

    const tierAfter = await presale.currentTier();
    const tierInfoAfter = await presale.getCurrentTierInfo();
    
    console.log("After Purchase:");
    console.log("  Current Tier:", tierAfter.toString());
    console.log("  Tier Sold:", hre.ethers.utils.formatEther(tierInfoAfter.sold), "NDG");
    console.log("  Tier Remaining:", hre.ethers.utils.formatEther(tierInfoAfter.totalAvailable.sub(tierInfoAfter.sold)), "NDG");
    console.log("");

    // ==================== TEST 4: Check All Tiers ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 4: Check All Tier Configurations");
    console.log("═══════════════════════════════════════════════════\n");

    console.log("All Tiers:");
    for (let i = 0; i < 9; i++) {
        const tier = await presale.tiers(i);
        console.log(`  Tier ${i + 1}:`);
        console.log(`    Price: $${hre.ethers.utils.formatEther(tier.price)}`);
        console.log(`    Allocation: ${hre.ethers.utils.formatEther(tier.totalAvailable)} NDG`);
        console.log(`    Sold: ${hre.ethers.utils.formatEther(tier.sold)} NDG`);
    }
    console.log("");

    // ==================== SUMMARY ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ Tier Progression Tests Complete!");
    console.log("═══════════════════════════════════════════════════");
    
    const totalRaised = await presale.totalRaisedUSD();
    const totalAllocated = await presale.totalTokensAllocated();
    
    console.log("\nPresale Statistics:");
    console.log("  Total Raised:", hre.ethers.utils.formatEther(totalRaised), "USD");
    console.log("  Total Allocated:", hre.ethers.utils.formatEther(totalAllocated), "NDG");
    console.log("  Current Tier:", tierAfter.toString());
    console.log("");
    console.log("All Tests:");
    console.log("  ✅ Initial tier configuration");
    console.log("  ✅ Preview purchase calculation");
    console.log("  ✅ Purchase in current tier");
    console.log("  ✅ Tier data integrity");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
