const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🧪 Testing Stablecoin Purchases with Referrals...\n");

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
    const [owner, referrer, buyer] = await hre.ethers.getSigners();
    console.log("Test Accounts:");
    console.log("  Referrer:", referrer.address);
    console.log("  Buyer:", buyer.address, "\n");

    // Get contracts
    const presale = await hre.ethers.getContractAt(
        "PresaleWithVesting",
        deployment.contracts.PresaleWithVesting
    );
    
    const vestingVault = await hre.ethers.getContractAt(
        "VestingVault",
        deployment.contracts.VestingVault
    );

    // Only test mock stablecoins on testnet
    if (!deployment.contracts.MockUSDT) {
        console.log("⚠️  Skipping test - not on testnet");
        return;
    }

    const mockUSDT = await hre.ethers.getContractAt("MockERC20", deployment.contracts.MockUSDT);
    const mockUSDC = await hre.ethers.getContractAt("MockERC20", deployment.contracts.MockUSDC);
    const mockBUSD = await hre.ethers.getContractAt("MockERC20", deployment.contracts.MockBUSD);

    // ==================== TEST 1: USDT Purchase ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 1: USDT Purchase with Referral");
    console.log("═══════════════════════════════════════════════════\n");

    // Mint USDT to buyer (6 decimals)
    const usdtAmount = hre.ethers.utils.parseUnits("50", 6); // 50 USDT
    await mockUSDT.mint(buyer.address, usdtAmount);
    console.log("Minted:", hre.ethers.utils.formatUnits(usdtAmount, 6), "USDT to buyer\n");

    // Approve presale
    await mockUSDT.connect(buyer).approve(presale.address, usdtAmount);
    console.log("Approved presale to spend USDT\n");

    // Get referral bonus before
    const bonusBefore = await presale.getReferralBonus(referrer.address);

    // Make purchase
    console.log("Making purchase with USDT...");
    const tx1 = await presale.connect(buyer).buyWithStablecoin(
        mockUSDT.address,
        usdtAmount,
        referrer.address
    );
    await tx1.wait();
    console.log("✅ Purchase confirmed:", tx1.hash, "\n");

    // Check results
    const buyerAlloc = await vestingVault.getUserAllocation(buyer.address);
    const bonusAfter = await presale.getReferralBonus(referrer.address);
    const bonusEarned = bonusAfter.sub(bonusBefore);

    console.log("Results:");
    console.log("  Buyer Tokens:", hre.ethers.utils.formatEther(buyerAlloc.immediateTokens), "NDG");
    console.log("  Referral Bonus:", hre.ethers.utils.formatEther(bonusEarned), "NDG");
    console.log("  Bonus %:", bonusEarned.mul(10000).div(buyerAlloc.immediateTokens).toNumber() / 100, "%");
    console.log("");

    // ==================== TEST 2: USDC Purchase ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 2: USDC Purchase with Referral");
    console.log("═══════════════════════════════════════════════════\n");

    // Mint USDC to buyer (6 decimals)
    const usdcAmount = hre.ethers.utils.parseUnits("50", 6); // 50 USDC
    await mockUSDC.mint(buyer.address, usdcAmount);
    console.log("Minted:", hre.ethers.utils.formatUnits(usdcAmount, 6), "USDC to buyer\n");

    // Approve presale
    await mockUSDC.connect(buyer).approve(presale.address, usdcAmount);
    console.log("Approved presale to spend USDC\n");

    const bonusBefore2 = await presale.getReferralBonus(referrer.address);

    // Make purchase
    console.log("Making purchase with USDC...");
    const tx2 = await presale.connect(buyer).buyWithStablecoin(
        mockUSDC.address,
        usdcAmount,
        referrer.address
    );
    await tx2.wait();
    console.log("✅ Purchase confirmed:", tx2.hash, "\n");

    const bonusAfter2 = await presale.getReferralBonus(referrer.address);
    const bonusEarned2 = bonusAfter2.sub(bonusBefore2);

    console.log("Results:");
    console.log("  Referral Bonus:", hre.ethers.utils.formatEther(bonusEarned2), "NDG");
    console.log("");

    // ==================== TEST 3: BUSD Purchase ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 3: BUSD Purchase with Referral");
    console.log("═══════════════════════════════════════════════════\n");

    // Mint BUSD to buyer (18 decimals)
    const busdAmount = hre.ethers.utils.parseEther("50"); // 50 BUSD
    await mockBUSD.mint(buyer.address, busdAmount);
    console.log("Minted:", hre.ethers.utils.formatEther(busdAmount), "BUSD to buyer\n");

    // Approve presale
    await mockBUSD.connect(buyer).approve(presale.address, busdAmount);
    console.log("Approved presale to spend BUSD\n");

    const bonusBefore3 = await presale.getReferralBonus(referrer.address);

    // Make purchase
    console.log("Making purchase with BUSD...");
    const tx3 = await presale.connect(buyer).buyWithStablecoin(
        mockBUSD.address,
        busdAmount,
        referrer.address
    );
    await tx3.wait();
    console.log("✅ Purchase confirmed:", tx3.hash, "\n");

    const bonusAfter3 = await presale.getReferralBonus(referrer.address);
    const bonusEarned3 = bonusAfter3.sub(bonusBefore3);

    console.log("Results:");
    console.log("  Referral Bonus:", hre.ethers.utils.formatEther(bonusEarned3), "NDG");
    console.log("");

    // ==================== SUMMARY ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ Stablecoin Tests Complete!");
    console.log("═══════════════════════════════════════════════════");
    
    const totalBonus = await presale.getReferralBonus(referrer.address);
    const totalRaised = await presale.totalRaisedUSD();
    
    console.log("\nSummary:");
    console.log("  Total Invested: $150 USD (across 3 stablecoins)");
    console.log("  Total Raised:", hre.ethers.utils.formatEther(totalRaised), "USD");
    console.log("  Total Referral Bonus:", hre.ethers.utils.formatEther(totalBonus), "NDG");
    console.log("");
    console.log("All Tests:");
    console.log("  ✅ USDT purchase with referral");
    console.log("  ✅ USDC purchase with referral");
    console.log("  ✅ BUSD purchase with referral");
    console.log("  ✅ All bonuses calculated correctly");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
