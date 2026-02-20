const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 Starting NetDAG Presale Testnet Deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from address:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB\n");

  // ==================== CONFIGURATION ====================
  
  const INITIAL_NDG_SUPPLY = ethers.utils.parseEther("1000000000"); // 1 billion NDG
  const LIQUIDITY_FUND = deployer.address; // Use deployer as liquidity fund for testing
  const BNB_PRICE = 60000000000; // $600 with 8 decimals (Chainlink format)
  
  // Mock stablecoins configuration
  const MOCK_USDT_DECIMALS = 18; // BSC USDT has 18 decimals
  const MOCK_USDC_DECIMALS = 18; // BSC USDC has 18 decimals
  const MOCK_BUSD_DECIMALS = 18; // BSC BUSD has 18 decimals

  // ==================== STEP 1: Deploy NDG Token ====================
  
  console.log("📦 Step 1: Deploying NDG Token...");
  const NDGToken = await ethers.getContractFactory("NDGToken");
  const ndgToken = await NDGToken.deploy(INITIAL_NDG_SUPPLY);
  await ndgToken.deployed();
  console.log("✅ NDG Token deployed to:", ndgToken.address);
  console.log("   Total Supply:", ethers.utils.formatEther(INITIAL_NDG_SUPPLY), "NDG\n");

  // ==================== STEP 2: Deploy Mock Chainlink Price Feed ====================
  
  console.log("📦 Step 2: Deploying Mock BNB/USD Price Feed...");
  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  const bnbPriceFeed = await MockV3Aggregator.deploy(8, BNB_PRICE); // 8 decimals, $600
  await bnbPriceFeed.deployed();
  console.log("✅ Mock Price Feed deployed to:", bnbPriceFeed.address);
  console.log("   BNB Price set to: $600\n");

  // ==================== STEP 3: Deploy Mock Stablecoins ====================
  
  console.log("📦 Step 3: Deploying Mock Stablecoins...");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  // Deploy USDT
  const mockUSDT = await MockERC20.deploy("Tether USD", "USDT", MOCK_USDT_DECIMALS);
  await mockUSDT.deployed();
  console.log("✅ Mock USDT deployed to:", mockUSDT.address);
  
  // Deploy USDC
  const mockUSDC = await MockERC20.deploy("USD Coin", "USDC", MOCK_USDC_DECIMALS);
  await mockUSDC.deployed();
  console.log("✅ Mock USDC deployed to:", mockUSDC.address);
  
  // Deploy BUSD
  const mockBUSD = await MockERC20.deploy("Binance USD", "BUSD", MOCK_BUSD_DECIMALS);
  await mockBUSD.deployed();
  console.log("✅ Mock BUSD deployed to:", mockBUSD.address);
  console.log("");

  // Mint test tokens to deployer
  const TEST_AMOUNT = ethers.utils.parseEther("100000"); // 100k of each
  await mockUSDT.mint(deployer.address, TEST_AMOUNT);
  await mockUSDC.mint(deployer.address, TEST_AMOUNT);
  await mockBUSD.mint(deployer.address, TEST_AMOUNT);
  console.log("💵 Minted 100,000 of each stablecoin to deployer\n");

  // ==================== STEP 4: Deploy VestingVault ====================
  
  console.log("📦 Step 4: Deploying VestingVault...");
  
  const stablecoins = [mockUSDT.address, mockUSDC.address, mockBUSD.address];
  
  const VestingVault = await ethers.getContractFactory("VestingVault");
  const vestingVault = await VestingVault.deploy(
    ndgToken.address,
    LIQUIDITY_FUND,
    bnbPriceFeed.address,
    stablecoins
  );
  await vestingVault.deployed();
  console.log("✅ VestingVault deployed to:", vestingVault.address);
  console.log("   Liquidity Fund:", LIQUIDITY_FUND, "\n");

  // ==================== STEP 5: Deploy PresaleWithVesting ====================
  
  console.log("📦 Step 5: Deploying PresaleWithVesting...");
  
  const PresaleWithVesting = await ethers.getContractFactory("PresaleWithVesting");
  const presale = await PresaleWithVesting.deploy(
    ndgToken.address,
    vestingVault.address,
    bnbPriceFeed.address,
    stablecoins
  );
  await presale.deployed();
  console.log("✅ PresaleWithVesting deployed to:", presale.address, "\n");

  // ==================== STEP 6: Configure Contracts ====================
  
  console.log("⚙️  Step 6: Configuring contracts...");
  
  // Set presale contract in VestingVault
  console.log("   Setting presale contract in VestingVault...");
  await vestingVault.setPresaleContract(presale.address);
  console.log("   ✅ Presale contract set");
  
  // Transfer NDG tokens to VestingVault (for presale allocation)
  const PRESALE_ALLOCATION = ethers.utils.parseEther("400000000"); // 400M NDG for presale
  console.log("   Transferring", ethers.utils.formatEther(PRESALE_ALLOCATION), "NDG to VestingVault...");
  await ndgToken.transfer(vestingVault.address, PRESALE_ALLOCATION);
  console.log("   ✅ Tokens transferred to VestingVault\n");

  // ==================== STEP 7: Verify Deployment ====================
  
  console.log("🔍 Step 7: Verifying deployment...");
  
  const vaultNDGBalance = await ndgToken.balanceOf(vestingVault.address);
  const deployerNDGBalance = await ndgToken.balanceOf(deployer.address);
  const currentTier = await presale.currentTier();
  
  console.log("   VestingVault NDG balance:", ethers.utils.formatEther(vaultNDGBalance), "NDG");
  console.log("   Deployer NDG balance:", ethers.utils.formatEther(deployerNDGBalance), "NDG");
  console.log("   Current presale tier:", currentTier.toString());
  console.log("   ✅ Verification complete\n");

  // ==================== DEPLOYMENT SUMMARY ====================
  
  console.log("=" .repeat(70));
  console.log("🎉 TESTNET DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(70));
  console.log("\n📋 CONTRACT ADDRESSES:\n");
  console.log("NDG Token:           ", ndgToken.address);
  console.log("VestingVault:        ", vestingVault.address);
  console.log("PresaleWithVesting:  ", presale.address);
  console.log("Mock BNB Price Feed: ", bnbPriceFeed.address);
  console.log("Mock USDT:           ", mockUSDT.address);
  console.log("Mock USDC:           ", mockUSDC.address);
  console.log("Mock BUSD:           ", mockBUSD.address);
  console.log("\n📋 CONFIGURATION:\n");
  console.log("Liquidity Fund:      ", LIQUIDITY_FUND);
  console.log("BNB Price:           ", "$600");
  console.log("Presale Allocation:  ", ethers.utils.formatEther(PRESALE_ALLOCATION), "NDG");
  console.log("\n💡 NEXT STEPS:\n");
  console.log("1. Save these addresses for testing");
  console.log("2. Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart");
  console.log("3. Mint test stablecoins using the faucet() function");
  console.log("4. Test purchases with buyWithBNB() or buyWithStablecoin()");
  console.log("5. Run tests: npx hardhat test\n");
  console.log("=" .repeat(70));
  console.log("\n✅ Ready to test!\n");

  // ==================== SAVE ADDRESSES TO FILE ====================
  
  const fs = require('fs');
  const addresses = {
    network: "BSC Testnet",
    timestamp: new Date().toISOString(),
    contracts: {
      NDGToken: ndgToken.address,
      VestingVault: vestingVault.address,
      PresaleWithVesting: presale.address,
      MockBNBPriceFeed: bnbPriceFeed.address,
      MockUSDT: mockUSDT.address,
      MockUSDC: mockUSDC.address,
      MockBUSD: mockBUSD.address
    },
    config: {
      liquidityFund: LIQUIDITY_FUND,
      bnbPrice: "$600",
      presaleAllocation: ethers.utils.formatEther(PRESALE_ALLOCATION) + " NDG"
    }
  };
  
  fs.writeFileSync(
    'deployment-testnet.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("📄 Addresses saved to: deployment-testnet.json\n");
}

// ==================== EXECUTE ====================

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:\n", error);
    process.exit(1);
  });