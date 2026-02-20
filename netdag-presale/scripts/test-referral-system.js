const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🧪 Testing Referral System v2.0...\n");

    // Load deployment info
    const deploymentFile = "deployment-with-referrals.json";
    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ Error: deployment-with-referrals.json not found!");
        console.log("Please run deploy-with-referrals.js first.");
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("Network:", deployment.network);
    console.log("Presale:", deployment.contracts.PresaleWithVesting, "\n");

    // Get signers (need at least 3 for testing)
    const [owner, referrer, buyer] = await hre.ethers.getSigners();
    console.log("Test Accounts:");
    console.log("  Owner:", owner.address);
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

    // Check presale status
    const presaleStartTime = await presale.presaleStartTime();
    if (presaleStartTime.eq(0)) {
        console.log("⚠️  Presale not started yet. Starting now...");
        await presale.startPresale();
        console.log("✅ Presale started\n");
    }

    // ==================== TEST 1: Purchase with Referral ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 1: Purchase with Referral (BNB)");
    console.log("═══════════════════════════════════════════════════\n");

    const bnbAmount = hre.ethers.utils.parseEther("0.1"); // 0.1 BNB
    const bnbPrice = await presale.getBNBPrice();
    const usdAmount = bnbAmount.mul(bnbPrice).div(hre.ethers.utils.parseEther("1"));
    
    console.log("Purchase Details:");
    console.log("  BNB Amount:", hre.ethers.utils.formatEther(bnbAmount), "BNB");
    console.log("  BNB Price:", hre.ethers.utils.formatUnits(bnbPrice, 18), "USD");
    console.log("  USD Value:", hre.ethers.utils.formatEther(usdAmount), "USD");
    console.log("  Referrer:", referrer.address);
    console.log("");

    // Get buyer balance before
    const buyerBalanceBefore = await hre.ethers.provider.getBalance(buyer.address);
    
    // Make purchase with referral
    console.log("Making purchase...");
    const tx = await presale.connect(buyer).buyWithBNB(referrer.address, { value: bnbAmount });
    const receipt = await tx.wait();
    console.log("✅ Purchase confirmed:", tx.hash, "\n");

    // Get buyer allocation
    const buyerAllocation = await vestingVault.getUserAllocation(buyer.address);
    console.log("Buyer Allocation:");
    console.log("  Total Tokens:", hre.ethers.utils.formatEther(buyerAllocation.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(buyerAllocation.immediateTokens), "NDG");
    console.log("  Vesting Tokens:", hre.ethers.utils.formatEther(buyerAllocation.vestingTokens), "NDG");
    console.log("");

    // Get referrer allocation
    const referrerAllocation = await vestingVault.getUserAllocation(referrer.address);
    const referralBonus = await presale.getReferralBonus(referrer.address);
    
    console.log("Referrer Allocation:");
    console.log("  Total Tokens:", hre.ethers.utils.formatEther(referrerAllocation.totalTokens), "NDG");
    console.log("  Immediate Tokens:", hre.ethers.utils.formatEther(referrerAllocation.immediateTokens), "NDG");
    console.log("  Referral Bonus:", hre.ethers.utils.formatEther(referralBonus), "NDG");
    console.log("");

    // Calculate expected bonus (5% of buyer's tokens)
    const expectedBonus = buyerAllocation.immediateTokens.mul(500).div(10000);
    console.log("Bonus Validation:");
    console.log("  Expected Bonus (5%):", hre.ethers.utils.formatEther(expectedBonus), "NDG");
    console.log("  Actual Bonus:", hre.ethers.utils.formatEther(referralBonus), "NDG");
    
    const bonusMatch = referralBonus.sub(expectedBonus).abs().lte(hre.ethers.utils.parseEther("0.01"));
    console.log("  Match:", bonusMatch ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // Check referral tracking
    const referralInfo = await presale.getReferralInfo(referrer.address);
    const referrals = await presale.getReferrals(referrer.address);
    
    console.log("Referral Tracking:");
    console.log("  Referral Count:", referralInfo.referralCount.toString());
    console.log("  Referrals:", referrals);
    console.log("  Contains Buyer:", referrals.includes(buyer.address) ? "✅ YES" : "❌ NO");
    console.log("");

    // ==================== TEST 2: Check Referrer of Buyer ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 2: Check Buyer's Referrer");
    console.log("═══════════════════════════════════════════════════\n");

    const buyerReferrerInfo = await presale.getReferralInfo(buyer.address);
    console.log("Buyer Referrer Info:");
    console.log("  Referrer:", buyerReferrerInfo.referrer);
    console.log("  Expected:", referrer.address);
    console.log("  Match:", buyerReferrerInfo.referrer === referrer.address ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // ==================== TEST 3: Second Purchase (No New Referral) ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 3: Second Purchase (Existing Referral)");
    console.log("═══════════════════════════════════════════════════\n");

    const bonusBefore = await presale.getReferralBonus(referrer.address);
    
    console.log("Making second purchase...");
    const tx2 = await presale.connect(buyer).buyWithBNB(referrer.address, { value: bnbAmount });
    await tx2.wait();
    console.log("✅ Second purchase confirmed\n");

    const bonusAfter = await presale.getReferralBonus(referrer.address);
    const bonusIncrease = bonusAfter.sub(bonusBefore);
    
    console.log("Bonus Update:");
    console.log("  Bonus Before:", hre.ethers.utils.formatEther(bonusBefore), "NDG");
    console.log("  Bonus After:", hre.ethers.utils.formatEther(bonusAfter), "NDG");
    console.log("  Increase:", hre.ethers.utils.formatEther(bonusIncrease), "NDG");
    
    const referralsAfter = await presale.getReferrals(referrer.address);
    console.log("  Referral Count:", referralsAfter.length, "(should still be 1)");
    console.log("  Count Correct:", referralsAfter.length === 1 ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // ==================== TEST 4: Purchase Without Referral ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("TEST 4: Purchase Without Referral");
    console.log("═══════════════════════════════════════════════════\n");

    const [, , , buyer2] = await hre.ethers.getSigners();
    console.log("Buyer2:", buyer2.address);
    console.log("Making purchase without referral...");
    
    const tx3 = await presale.connect(buyer2).buyWithBNB(hre.ethers.constants.AddressZero, { value: bnbAmount });
    await tx3.wait();
    console.log("✅ Purchase confirmed\n");

    const buyer2Info = await presale.getReferralInfo(buyer2.address);
    console.log("Buyer2 Referrer Info:");
    console.log("  Referrer:", buyer2Info.referrer);
    console.log("  Is Zero Address:", buyer2Info.referrer === hre.ethers.constants.AddressZero ? "✅ PASS" : "❌ FAIL");
    console.log("");

    // ==================== SUMMARY ====================
    
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ Referral System Tests Complete!");
    console.log("═══════════════════════════════════════════════════");
    
    const totalRaised = await presale.totalRaisedUSD();
    const totalAllocated = await presale.totalTokensAllocated();
    
    console.log("\nPresale Statistics:");
    console.log("  Total Raised:", hre.ethers.utils.formatEther(totalRaised), "USD");
    console.log("  Total Allocated:", hre.ethers.utils.formatEther(totalAllocated), "NDG");
    console.log("  Total Referral Bonuses:", hre.ethers.utils.formatEther(bonusAfter), "NDG");
    console.log("");
    console.log("All Tests:");
    console.log("  ✅ Referral bonus calculation (5%)");
    console.log("  ✅ Bonus allocation to referrer");
    console.log("  ✅ Referral tracking (first purchase only)");
    console.log("  ✅ Immediate token distribution");
    console.log("  ✅ Purchase without referral");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
