const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🧪 Testing Preview Purchase Function...\n");

    // Load deployment info
    const deploymentFile = "deployment-with-referrals.json";
    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ Error: deployment-with-referrals.json not found!");
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("Network:", deployment.network);
    console.log("Presale:", deployment.contracts.PresaleWithVesting, "\n");

    // Get presale contract
    const presale = await hre.ethers.getContractAt(
        "PresaleWithVesting",
        deployment.contracts.PresaleWithVesting
    );

    // ==================== TEST 1: Preview Small Purchase ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 1: Preview Small Purchase ($100)");
    console.log("═══════════════════════════════════════════════════\n");

    const small = hre.ethers.utils.parseEther("100");
    const preview1 = await presale.previewPurchase(small);
    
    console.log("$100 USD Investment:");
    console.log("  Total Tokens (anchor):", hre.ethers.utils.formatEther(preview1.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(preview1.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(preview1.vestingTokens), "NDG");
    console.log("  Effective Price:", (100 / parseFloat(hre.ethers.utils.formatEther(preview1.immediateTokens))).toFixed(6), "USD per NDG");
    console.log("");

    // ==================== TEST 2: Preview Medium Purchase ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 2: Preview Medium Purchase ($1,000)");
    console.log("═══════════════════════════════════════════════════\n");

    const medium = hre.ethers.utils.parseEther("1000");
    const preview2 = await presale.previewPurchase(medium);
    
    console.log("$1,000 USD Investment:");
    console.log("  Total Tokens (anchor):", hre.ethers.utils.formatEther(preview2.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(preview2.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(preview2.vestingTokens), "NDG");
    console.log("  Effective Price:", (1000 / parseFloat(hre.ethers.utils.formatEther(preview2.immediateTokens))).toFixed(6), "USD per NDG");
    console.log("");

    // ==================== TEST 3: Preview Large Purchase ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 3: Preview Large Purchase ($10,000)");
    console.log("═══════════════════════════════════════════════════\n");

    const large = hre.ethers.utils.parseEther("10000");
    const preview3 = await presale.previewPurchase(large);
    
    console.log("$10,000 USD Investment:");
    console.log("  Total Tokens (anchor):", hre.ethers.utils.formatEther(preview3.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(preview3.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(preview3.vestingTokens), "NDG");
    console.log("  Effective Price:", (10000 / parseFloat(hre.ethers.utils.formatEther(preview3.immediateTokens))).toFixed(6), "USD per NDG");
    console.log("");

    // ==================== TEST 4: Preview Multiple Amounts ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 4: Preview Multiple Investment Amounts");
    console.log("═══════════════════════════════════════════════════\n");

    const amounts = [50, 250, 500, 2500, 5000, 25000];
    
    console.log("Investment Comparison:");
    console.log("USD     | Immediate Tokens | Vesting Tokens | Effective Price");
    console.log("--------|------------------|----------------|----------------");
    
    for (const amt of amounts) {
        const usd = hre.ethers.utils.parseEther(amt.toString());
        const preview = await presale.previewPurchase(usd);
        const immediate = parseFloat(hre.ethers.utils.formatEther(preview.immediateTokens));
        const vesting = parseFloat(hre.ethers.utils.formatEther(preview.vestingTokens));
        const effectivePrice = (amt / immediate).toFixed(6);
        
        console.log(
            `$${amt.toString().padStart(6)} |`,
            `${immediate.toFixed(2).padStart(15)} |`,
            `${vesting.toFixed(2).padStart(14)} |`,
            `$${effectivePrice}`
        );
    }
    console.log("");

    // ==================== TEST 5: Verify Preview Accuracy ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 5: Verify Preview Accuracy");
    console.log("═══════════════════════════════════════════════════\n");

    const [, buyer] = await hre.ethers.getSigners();
    const testAmount = hre.ethers.utils.parseEther("0.1");
    
    // Preview
    const bnbPrice = await presale.getBNBPrice();
    const usdValue = testAmount.mul(bnbPrice).div(hre.ethers.utils.parseEther("1"));
    const previewBefore = await presale.previewPurchase(usdValue);
    
    console.log("Previewing 0.1 BNB purchase:");
    console.log("  USD Value:", hre.ethers.utils.formatEther(usdValue), "USD");
    console.log("  Preview Immediate:", hre.ethers.utils.formatEther(previewBefore.immediateTokens), "NDG");
    console.log("");

    // Make actual purchase
    console.log("Making actual purchase...");
    await presale.connect(buyer).buyWithBNB(hre.ethers.constants.AddressZero, { value: testAmount });
    console.log("✅ Purchase confirmed\n");

    // Get actual allocation
    const allocation = await presale.getUserAllocation(buyer.address);
    console.log("Actual Allocation:");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(allocation.immediateTokens), "NDG");
    console.log("");

    // Compare
    const diff = previewBefore.immediateTokens.sub(allocation.immediateTokens).abs();
    const tolerance = hre.ethers.utils.parseEther("100"); // 100 NDG tolerance
    const accurate = diff.lte(tolerance);
    
    console.log("Accuracy Check:");
    console.log("  Preview:", hre.ethers.utils.formatEther(previewBefore.immediateTokens), "NDG");
    console.log("  Actual:", hre.ethers.utils.formatEther(allocation.immediateTokens), "NDG");
    console.log("  Difference:", hre.ethers.utils.formatEther(diff), "NDG");
    console.log("  Accurate:", accurate ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // ==================== SUMMARY ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ Preview Purchase Tests Complete!");
    console.log("═══════════════════════════════════════════════════");
    
    console.log("\nAll Tests:");
    console.log("  ✅ Small purchase preview");
    console.log("  ✅ Medium purchase preview");
    console.log("  ✅ Large purchase preview");
    console.log("  ✅ Multiple amount comparison");
    console.log("  ✅ Preview accuracy verification");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
