const hre = require('hardhat');

async function main() {
    console.log('🚀 Starting deployment to BSC Testnet...\n');

    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', hre.ethers.utils.formatEther(balance), 'BNB\n');

    // Initial supply: 1 billion tokens (1,000,000,000 * 10^18)
    const initialSupply = hre.ethers.utils.parseEther('1000000000');

    // 1. Deploy NDGToken
    console.log('📄 Deploying NDGToken...');
    console.log('Initial Supply:', hre.ethers.utils.formatEther(initialSupply), 'NDG\n');
    const NDGToken = await hre.ethers.getContractFactory('NDGToken');
    const token = await NDGToken.deploy(initialSupply);
    await token.deployed();
    console.log('✅ NDGToken deployed to:', token.address, '\n');

    // BSC Testnet addresses
    const liquidityFund = deployer.address; // Use deployer as liquidity fund
    const bnbPriceFeed = '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526'; // Chainlink BNB/USD on BSC Testnet
    const stablecoins = [
        '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // USDT BSC Testnet
        '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee'  // BUSD BSC Testnet
    ];

    // 2. Deploy VestingVault
    console.log('📄 Deploying VestingVault...');
    console.log('Liquidity Fund:', liquidityFund);
    console.log('BNB Price Feed:', bnbPriceFeed);
    console.log('Stablecoins:', stablecoins.join(', '), '\n');
    const VestingVault = await hre.ethers.getContractFactory('VestingVault');
    const vault = await VestingVault.deploy(token.address, liquidityFund, bnbPriceFeed, stablecoins);
    await vault.deployed();
    console.log('✅ VestingVault deployed to:', vault.address, '\n');

    // 3. Deploy PresaleWithVesting
    console.log('📄 Deploying PresaleWithVesting...');
    console.log('BNB Price Feed:', bnbPriceFeed);
    console.log('Stablecoins:', stablecoins.join(', '), '\n');
    const PresaleWithVesting = await hre.ethers.getContractFactory('PresaleWithVesting');
    const presale = await PresaleWithVesting.deploy(token.address, vault.address, bnbPriceFeed, stablecoins);
    await presale.deployed();
    console.log('✅ PresaleWithVesting deployed to:', presale.address, '\n');

    // Summary
    console.log('🎉 ALL CONTRACTS DEPLOYED!\n');
    console.log('='.repeat(60));
    console.log('📋 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log('NDGToken:', token.address);
    console.log('VestingVault:', vault.address);
    console.log('PresaleWithVesting:', presale.address);
    console.log('Deployer:', deployer.address);
    console.log('Liquidity Fund:', liquidityFund);
    console.log('BNB Price Feed:', bnbPriceFeed);
    console.log('Stablecoins:', stablecoins.join(', '));
    console.log('Initial Supply:', hre.ethers.utils.formatEther(initialSupply), 'NDG');
    console.log('='.repeat(60));
    console.log('\n💾 Save these addresses!\n');
}

main()
    .then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});