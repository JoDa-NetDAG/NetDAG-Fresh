const hre = require("hardhat");

async function main() {
    console.log("\n🚀 Starting NetDAG Presale MAINNET Deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deploying from address:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "BNB\n");

    // MAINNET CONFIGURATION
    const LIQUIDITY_FUND = process.env.LIQUIDITY_FUND_ADDRESS;
    const BNB_USD_PRICE_FEED = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"; // BSC Mainnet BNB/USD
    
    // Verify liquidity fund address is set
    if (!LIQUIDITY_FUND || LIQUIDITY_FUND === "") {
        throw new Error("❌ LIQUIDITY_FUND_ADDRESS not set in .env file!");
    }

    console.log("⚙️  Configuration:");
    console.log("   Liquidity Fund:", LIQUIDITY_FUND);
    console.log("   BNB Price Feed:", BNB_USD_PRICE_FEED);
    console.log("");

    // Step 1: Deploy NDG Token
    console.log("📦 Step 1: Deploying NDG Token...");
    const NDGToken = await ethers.getContractFactory("NDGToken");
    const ndgToken = await NDGToken.deploy();
    await ndgToken.deployed();
    console.log("✅ NDG Token deployed to:", ndgToken.address);
    
    const totalSupply = await ndgToken.totalSupply();
    console.log("   Total Supply:", ethers.utils.formatEther(totalSupply), "NDG\n");

    // Step 2: Deploy VestingVault
    console.log("📦 Step 2: Deploying VestingVault...");
    const VestingVault = await ethers.getContractFactory("VestingVault");
    const vestingVault = await VestingVault.deploy(
        ndgToken.address,
        LIQUIDITY_FUND
    );
    await vestingVault.deployed();
    console.log("✅ VestingVault deployed to:", vestingVault.address);
    console.log("   Liquidity Fund:", LIQUIDITY_FUND, "\n");

    // Step 3: Deploy PresaleWithVesting
    console.log("📦 Step 3: Deploying PresaleWithVesting...");
    const PresaleWithVesting = await ethers.getContractFactory("PresaleWithVesting");
    const presale = await PresaleWithVesting.deploy(
        ndgToken.address,
        vestingVault.address,
        BNB_USD_PRICE_FEED
    );
    await presale.deployed();
    console.log("✅ PresaleWithVesting deployed to:", presale.address, "\n");

    // Step 4: Configure contracts
    console.log("⚙️  Step 4: Configuring contracts...");
    
    // Set presale contract in VestingVault
    console.log("   Setting presale contract in VestingVault...");
    let tx = await vestingVault.setPresaleContract(presale.address);
    await tx.wait();
    console.log("   ✅ Presale contract set");

    // Transfer 400M NDG to VestingVault (40% of total supply)
    const presaleAllocation = ethers.utils.parseEther("400000000");
    console.log("   Transferring", ethers.utils.formatEther(presaleAllocation), "NDG to VestingVault...");
    tx = await ndgToken.transfer(vestingVault.address, presaleAllocation);
    await tx.wait();
    console.log("   ✅ Tokens transferred to VestingVault\n");

    // Step 5: Verification
    console.log("🔍 Step 5: Verifying deployment...");
    const vaultBalance = await ndgToken.balanceOf(vestingVault.address);
    const deployerBalance = await ndgToken.balanceOf(deployer.address);
    console.log("   VestingVault NDG balance:", ethers.utils.formatEther(vaultBalance), "NDG");
    console.log("   Deployer NDG balance:", ethers.utils.formatEther(deployerBalance), "NDG");
    console.log("   ✅ Verification complete\n");

    // Save deployment info
    const deployment = {
        network: "bsc_mainnet",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            NDGToken: ndgToken.address,
            VestingVault: vestingVault.address,
            PresaleWithVesting: presale.address,
            BNBPriceFeed: BNB_USD_PRICE_FEED
        },
        configuration: {
            liquidityFund: LIQUIDITY_FUND,
            presaleAllocation: ethers.utils.formatEther(presaleAllocation)
        }
    };

    const fs = require('fs');
    fs.writeFileSync(
        'deployment-mainnet.json',
        JSON.stringify(deployment, null, 2)
    );

    console.log("======================================================================");
    console.log("🎉 MAINNET DEPLOYMENT COMPLETE!");
    console.log("======================================================================\n");
    console.log("📋 CONTRACT ADDRESSES:\n");
    console.log("NDG Token:           ", ndgToken.address);
    console.log("VestingVault:        ", vestingVault.address);
    console.log("PresaleWithVesting:  ", presale.address);
    console.log("BNB Price Feed:      ", BNB_USD_PRICE_FEED);
    console.log("\n📋 CONFIGURATION:\n");
    console.log("Liquidity Fund:      ", LIQUIDITY_FUND);
    console.log("Presale Allocation:  ", ethers.utils.formatEther(presaleAllocation), "NDG");
    console.log("\n⚠️  IMPORTANT NEXT STEPS:\n");
    console.log("1. ✅ Save these addresses securely");
    console.log("2. 🔍 Verify contracts on BSCScan:");
    console.log("   npx hardhat verify --network bsc", ndgToken.address);
    console.log("   npx hardhat verify --network bsc", vestingVault.address, ndgToken.address, LIQUIDITY_FUND);
    console.log("   npx hardhat verify --network bsc", presale.address, ndgToken.address, vestingVault.address, BNB_USD_PRICE_FEED);
    console.log("3. 🔐 Transfer ownership if needed");
    console.log("4. 📢 Announce presale addresses");
    console.log("\n======================================================================\n");
    console.log("📄 Deployment details saved to: deployment-mainnet.json\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:\n", error);
        process.exit(1);
    });