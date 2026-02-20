const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Deploying NetDAG Presale with Referral System v2.0...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.utils.formatEther(balance), "BNB\n");

    // Network configuration
    const network = hre.network.name;
    console.log("Network:", network, "\n");

    // ==================== STEP 1: Deploy NDGToken ====================
    
    console.log("📦 Step 1: Deploying NDGToken...");
    const initialSupply = hre.ethers.utils.parseEther("1000000000"); // 1 billion
    console.log("Initial Supply:", hre.ethers.utils.formatEther(initialSupply), "NDG\n");
    
    const NDGToken = await hre.ethers.getContractFactory("NDGToken");
    const ndgToken = await NDGToken.deploy(initialSupply);
    await ndgToken.deployed();
    console.log("✅ NDGToken deployed to:", ndgToken.address);
    
    const totalSupply = await ndgToken.totalSupply();
    console.log("   Total Supply:", hre.ethers.utils.formatEther(totalSupply), "NDG\n");

    // ==================== STEP 2: Deploy Mock Price Feeds & Stablecoins (Testnet) ====================
    
    let bnbPriceFeed;
    let mockUSDT, mockUSDC, mockBUSD;
    let stablecoins = [];

    if (network === "bscTestnet" || network === "hardhat" || network === "localhost") {
        console.log("📦 Step 2: Deploying Mock Contracts (Testnet)...");
        
        // Deploy Mock BNB Price Feed
        const MockV3Aggregator = await hre.ethers.getContractFactory("MockV3Aggregator");
        bnbPriceFeed = await MockV3Aggregator.deploy(8, 60000000000); // $600 BNB
        await bnbPriceFeed.deployed();
        console.log("✅ MockBNBPriceFeed deployed to:", bnbPriceFeed.address);
        
        // Deploy Mock Stablecoins
        const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
        
        mockUSDT = await MockERC20.deploy("Mock USDT", "USDT", 6);
        await mockUSDT.deployed();
        console.log("✅ MockUSDT deployed to:", mockUSDT.address);
        
        mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
        await mockUSDC.deployed();
        console.log("✅ MockUSDC deployed to:", mockUSDC.address);
        
        mockBUSD = await MockERC20.deploy("Mock BUSD", "BUSD", 18);
        await mockBUSD.deployed();
        console.log("✅ MockBUSD deployed to:", mockBUSD.address);
        
        stablecoins = [mockUSDT.address, mockUSDC.address, mockBUSD.address];
        console.log("");
    } else {
        // Mainnet/Production - use real addresses
        console.log("📦 Step 2: Using Production Addresses...");
        bnbPriceFeed = { address: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE" }; // BSC Mainnet BNB/USD
        stablecoins = [
            "0x55d398326f99059fF775485246999027B3197955", // USDT
            "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
            "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"  // BUSD
        ];
        console.log("   BNB Price Feed:", bnbPriceFeed.address);
        console.log("   Stablecoins:", stablecoins.join(", "));
        console.log("");
    }

    // ==================== STEP 3: Deploy VestingVault ====================
    
    console.log("📦 Step 3: Deploying VestingVault...");
    const LIQUIDITY_FUND = deployer.address; // For testnet, use deployer
    console.log("Liquidity Fund:", LIQUIDITY_FUND, "\n");
    
    const VestingVault = await hre.ethers.getContractFactory("VestingVault");
    const vestingVault = await VestingVault.deploy(
        ndgToken.address,
        LIQUIDITY_FUND,
        bnbPriceFeed.address,
        stablecoins
    );
    await vestingVault.deployed();
    console.log("✅ VestingVault deployed to:", vestingVault.address, "\n");

    // ==================== STEP 4: Deploy PresaleWithVesting ====================
    
    console.log("📦 Step 4: Deploying PresaleWithVesting with Referral System...");
    
    const PresaleWithVesting = await hre.ethers.getContractFactory("PresaleWithVesting");
    const presale = await PresaleWithVesting.deploy(
        ndgToken.address,
        vestingVault.address,
        bnbPriceFeed.address,
        stablecoins
    );
    await presale.deployed();
    console.log("✅ PresaleWithVesting deployed to:", presale.address);
    
    // Check referral bonus
    const referralBonus = await presale.referralBonusPercent();
    console.log("   Referral Bonus:", referralBonus.toString(), "basis points (", referralBonus / 100, "%)\n");

    // ==================== STEP 5: Configure Contracts ====================
    
    console.log("⚙️  Step 5: Configuring contracts...");
    
    // Set presale contract in VestingVault
    console.log("   Setting presale contract in VestingVault...");
    await vestingVault.setPresaleContract(presale.address);
    console.log("   ✅ Presale contract set");
    
    // Transfer NDG tokens to VestingVault (600M for presale)
    const PRESALE_ALLOCATION = hre.ethers.utils.parseEther("600000000"); // 600M NDG
    console.log("   Transferring", hre.ethers.utils.formatEther(PRESALE_ALLOCATION), "NDG to VestingVault...");
    await ndgToken.transfer(vestingVault.address, PRESALE_ALLOCATION);
    console.log("   ✅ Tokens transferred to VestingVault\n");

    // ==================== STEP 6: Verify Balances ====================
    
    console.log("📊 Step 6: Verifying balances...");
    const vaultBalance = await ndgToken.balanceOf(vestingVault.address);
    const deployerBalance = await ndgToken.balanceOf(deployer.address);
    console.log("   VestingVault:", hre.ethers.utils.formatEther(vaultBalance), "NDG");
    console.log("   Deployer:", hre.ethers.utils.formatEther(deployerBalance), "NDG\n");

    // ==================== STEP 7: Save Deployment Info ====================
    
    console.log("💾 Step 7: Saving deployment info...");
    
    const deploymentInfo = {
        network: network,
        deployer: deployer.address,
        timestamp: new Date().toISOString().split('T')[0],
        contracts: {
            NDGToken: ndgToken.address,
            VestingVault: vestingVault.address,
            PresaleWithVesting: presale.address,
            BNBPriceFeed: bnbPriceFeed.address
        },
        referralEnabled: true,
        referralBonus: "5%"
    };

    if (network === "bscTestnet" || network === "hardhat" || network === "localhost") {
        deploymentInfo.contracts.MockUSDT = mockUSDT.address;
        deploymentInfo.contracts.MockUSDC = mockUSDC.address;
        deploymentInfo.contracts.MockBUSD = mockBUSD.address;
    }

    const filename = "deployment-with-referrals.json";
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log("   ✅ Deployment info saved to", filename, "\n");

    // ==================== SUMMARY ====================
    
    console.log("✅ Deployment Complete!\n");
    console.log("═══════════════════════════════════════════════════");
    console.log("📋 Deployment Summary");
    console.log("═══════════════════════════════════════════════════");
    console.log("Network:", network);
    console.log("Deployer:", deployer.address);
    console.log("");
    console.log("Contract Addresses:");
    console.log("  NDGToken:", ndgToken.address);
    console.log("  VestingVault:", vestingVault.address);
    console.log("  PresaleWithVesting:", presale.address);
    console.log("");
    console.log("Referral System:");
    console.log("  Status: ENABLED");
    console.log("  Bonus: 5% (500 basis points)");
    console.log("");
    console.log("Token Distribution:");
    console.log("  Total Supply: 1,000,000,000 NDG");
    console.log("  Presale Allocation: 600,000,000 NDG");
    console.log("  Deployer: 400,000,000 NDG");
    console.log("");
    console.log("Next Steps:");
    console.log("  1. Run: npx hardhat run scripts/start-presale-v2.js --network", network);
    console.log("  2. Test referrals with test scripts");
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
