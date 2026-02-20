const hre = require("hardhat");

async function main() {
  console.log("🚀 DEPLOYING ALL CONTRACTS (CLEAN)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB\n");

  // Addresses
  const BNB_PRICE_FEED = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"; // BSC Testnet
  const USDT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"; // BSC Testnet
  const USDC = "0x64544969ed7EBf5f083679233325356EbE738930"; // BSC Testnet
  const LIQUIDITY_FUND = deployer.address; // Use deployer as liquidity fund

  // 1. Deploy NDG Token
  console.log("1️⃣ Deploying NDG Token...");
  const NDGToken = await ethers.getContractFactory("NDGToken");
  const ndgToken = await NDGToken.deploy(ethers.utils.parseEther("1000000000")); // 1 billion NDG
  await ndgToken.deployed();
  console.log("✅ NDG Token:", ndgToken.address, "\n");

  // 2. Deploy VestingVault
  console.log("2️⃣ Deploying VestingVault...");
  const VestingVault = await ethers.getContractFactory("VestingVault");
  const vestingVault = await VestingVault.deploy(
    ndgToken.address,
    LIQUIDITY_FUND,
    BNB_PRICE_FEED,
    [USDT, USDC]
  );
  await vestingVault.deployed();
  console.log("✅ VestingVault:", vestingVault.address, "\n");

  // 3. Deploy Presale
  console.log("3️⃣ Deploying PresaleWithVesting...");
  const Presale = await ethers.getContractFactory("PresaleWithVesting");
  const presale = await Presale.deploy(
    ndgToken.address,
    vestingVault.address,
    BNB_PRICE_FEED,
    [USDT, USDC]
  );
  await presale.deployed();
  console.log("✅ Presale:", presale.address, "\n");

  // 4. Connect contracts
  console.log("4️⃣ Connecting contracts...");
  
  await vestingVault.setPresaleContract(presale.address);
  console.log("✅ VestingVault connected to Presale");
  
  await vestingVault.setTreasuryAddress(deployer.address);
  console.log("✅ Treasury address set");

  // 5. Transfer tokens to VestingVault
  console.log("\n5️⃣ Transferring 600M NDG to VestingVault...");
  const presaleAllocation = ethers.utils.parseEther("600000000");
  await ndgToken.transfer(vestingVault.address, presaleAllocation);
  console.log("✅ Transferred");

  // 6. Start presale
  console.log("\n6️⃣ Starting presale...");
  await presale.startPresale();
  console.log("✅ Presale started");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("📋 NDG Token:", ndgToken.address);
  console.log("📋 VestingVault:", vestingVault.address);
  console.log("📋 Presale:", presale.address);
  console.log("=".repeat(60));
}

main().catch(console.error);