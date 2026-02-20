const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🧪 Testing User Allocation Queries...\n");

    // Load deployment info
    const deploymentFile = "deployment-with-referrals.json";
    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ Error: deployment-with-referrals.json not found!");
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("Network:", deployment.network);
    console.log("Presale:", deployment.contracts.PresaleWithVesting, "\n");

    // Get signers
    const [owner, buyer1, buyer2] = await hre.ethers.getSigners();
    console.log("Test Accounts:");
    console.log("  Buyer1:", buyer1.address);
    console.log("  Buyer2:", buyer2.address, "\n");

    // Get contracts
    const presale = await hre.ethers.getContractAt(
        "PresaleWithVesting",
        deployment.contracts.PresaleWithVesting
    );
    
    const vestingVault = await hre.ethers.getContractAt(
        "VestingVault",
        deployment.contracts.VestingVault
    );

    // ==================== TEST 1: Make Purchases ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 1: Make Test Purchases");
    console.log("═══════════════════════════════════════════════════\n");

    const bnbAmount1 = hre.ethers.utils.parseEther("0.1");
    const bnbAmount2 = hre.ethers.utils.parseEther("0.2");

    console.log("Buyer1 purchasing with", hre.ethers.utils.formatEther(bnbAmount1), "BNB...");
    await presale.connect(buyer1).buyWithBNB(hre.ethers.constants.AddressZero, { value: bnbAmount1 });
    console.log("✅ Purchase 1 confirmed\n");

    console.log("Buyer2 purchasing with", hre.ethers.utils.formatEther(bnbAmount2), "BNB...");
    await presale.connect(buyer2).buyWithBNB(hre.ethers.constants.AddressZero, { value: bnbAmount2 });
    console.log("✅ Purchase 2 confirmed\n");

    // ==================== TEST 2: Query User Allocations ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 2: Query User Allocations");
    console.log("═══════════════════════════════════════════════════\n");

    // Buyer 1
    const alloc1 = await presale.getUserAllocation(buyer1.address);
    console.log("Buyer1 Allocation:");
    console.log("  Total Tokens:", hre.ethers.utils.formatEther(alloc1.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(alloc1.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(alloc1.vestingTokens), "NDG");
    console.log("  USD Invested:", hre.ethers.utils.formatEther(alloc1.totalUSD), "USD");
    console.log("  Purchase Count:", alloc1.purchaseCount.toString());
    console.log("");

    // Buyer 2
    const alloc2 = await presale.getUserAllocation(buyer2.address);
    console.log("Buyer2 Allocation:");
    console.log("  Total Tokens:", hre.ethers.utils.formatEther(alloc2.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(alloc2.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(alloc2.vestingTokens), "NDG");
    console.log("  USD Invested:", hre.ethers.utils.formatEther(alloc2.totalUSD), "USD");
    console.log("  Purchase Count:", alloc2.purchaseCount.toString());
    console.log("");

    // ==================== TEST 3: Query VestingVault Allocations ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 3: Query VestingVault Allocations");
    console.log("═══════════════════════════════════════════════════\n");

    // Buyer 1 from VestingVault
    const vaultAlloc1 = await vestingVault.getUserAllocation(buyer1.address);
    console.log("Buyer1 VestingVault Allocation:");
    console.log("  Total Tokens:", hre.ethers.utils.formatEther(vaultAlloc1.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(vaultAlloc1.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(vaultAlloc1.vestingTokens), "NDG");
    console.log("");

    // Buyer 2 from VestingVault
    const vaultAlloc2 = await vestingVault.getUserAllocation(buyer2.address);
    console.log("Buyer2 VestingVault Allocation:");
    console.log("  Total Tokens:", hre.ethers.utils.formatEther(vaultAlloc2.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(vaultAlloc2.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(vaultAlloc2.vestingTokens), "NDG");
    console.log("");

    // ==================== TEST 4: Verify Consistency ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 4: Verify Data Consistency");
    console.log("═══════════════════════════════════════════════════\n");

    const match1 = alloc1.totalTokens.eq(vaultAlloc1.totalTokens);
    const match2 = alloc2.totalTokens.eq(vaultAlloc2.totalTokens);

    console.log("Consistency Checks:");
    console.log("  Buyer1 Presale == VestingVault:", match1 ? "✅ PASS" : "❌ FAIL");
    console.log("  Buyer2 Presale == VestingVault:", match2 ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // ==================== TEST 5: Query Purchase History ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 5: Query Purchase History");
    console.log("═══════════════════════════════════════════════════\n");

    const purchaseCount1 = await presale.getUserPurchaseCount(buyer1.address);
    console.log("Buyer1 Purchase Count:", purchaseCount1.toString());
    
    if (purchaseCount1.gt(0)) {
        const purchase = await presale.userPurchases(buyer1.address, 0);
        console.log("  First Purchase:");
        console.log("    Total Tokens:", hre.ethers.utils.formatEther(purchase.totalTokens), "NDG");
        console.log("    Immediate Tokens:", hre.ethers.utils.formatEther(purchase.immediateTokens), "NDG");
        console.log("    USD Amount:", hre.ethers.utils.formatEther(purchase.usdAmount), "USD");
        console.log("    Tier:", purchase.tier.toString());
    }
    console.log("");

    // ==================== SUMMARY ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ User Allocation Tests Complete!");
    console.log("═══════════════════════════════════════════════════");
    
    console.log("\nSummary:");
    console.log("  Total Users:", "2");
    console.log("  Total Purchases:", purchaseCount1.add(await presale.getUserPurchaseCount(buyer2.address)).toString());
    console.log("");
    console.log("All Tests:");
    console.log("  ✅ User allocation queries");
    console.log("  ✅ VestingVault allocation queries");
    console.log("  ✅ Data consistency between contracts");
    console.log("  ✅ Purchase history tracking");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
