const hre = require('hardhat');

async function main() {
    console.log('🔧 Starting contract setup...\n');

    const [deployer] = await hre.ethers.getSigners();
    console.log('Setup account:', deployer.address, '\n');

    // Contract addresses from deployment
    const NDG_TOKEN = '0xA1f0eFEceA319da623f553b6ECD7411167394dE5';
    const VESTING_VAULT = '0xdC68eb05Cb64b036Bb9dEfF762C4bbb1c1cb5F72';
    const PRESALE = '0x75893CC311530874C52Ec563ed5513FF345311EA';

    // Get contract instances
    const ndgToken = await hre.ethers.getContractAt('NDGToken', NDG_TOKEN);
    const vestingVault = await hre.ethers.getContractAt('VestingVault', VESTING_VAULT);
    const presale = await hre.ethers.getContractAt('PresaleWithVesting', PRESALE);

    console.log('📊 Initial balances:');
    const deployerBalance = await ndgToken.balanceOf(deployer.address);
    console.log('Deployer:', hre.ethers.utils.formatEther(deployerBalance), 'NDG');
    console.log('VestingVault:', hre.ethers.utils.formatEther(await ndgToken.balanceOf(VESTING_VAULT)), 'NDG');
    console.log('Presale:', hre.ethers.utils.formatEther(await ndgToken.balanceOf(PRESALE)), 'NDG\n');

    // 1. Set PresaleWithVesting as the presale contract in VestingVault
    console.log('🔑 Step 1: Setting PresaleWithVesting as presale contract...');
    const tx1 = await vestingVault.setPresaleContract(PRESALE);
    await tx1.wait();
    console.log('✅ Presale contract set!\n');

    // 2. Transfer tokens to VestingVault (60% = 600M tokens for vesting)
    console.log('💰 Step 2: Transferring 600M NDG to VestingVault...');
    const vaultAmount = hre.ethers.utils.parseEther('600000000');
    const tx2 = await ndgToken.transfer(VESTING_VAULT, vaultAmount);
    await tx2.wait();
    console.log('✅ Transferred 600M NDG to VestingVault!\n');

    // 3. Transfer tokens to Presale (30% = 300M tokens for presale)
    console.log('💰 Step 3: Transferring 300M NDG to PresaleWithVesting...');
    const presaleAmount = hre.ethers.utils.parseEther('300000000');
    const tx3 = await ndgToken.transfer(PRESALE, presaleAmount);
    await tx3.wait();
    console.log('✅ Transferred 300M NDG to PresaleWithVesting!\n');

    // 4. Verify setup
    console.log('✅ Step 4: Verifying setup...');
    const presaleContractAddress = await vestingVault.presaleContract();
    const vaultBalance = await ndgToken.balanceOf(VESTING_VAULT);
    const presaleBalance = await ndgToken.balanceOf(PRESALE);
    const deployerFinal = await ndgToken.balanceOf(deployer.address);

    console.log('\n📊 Final balances:');
    console.log('Deployer:', hre.ethers.utils.formatEther(deployerFinal), 'NDG');
    console.log('VestingVault:', hre.ethers.utils.formatEther(vaultBalance), 'NDG');
    console.log('Presale:', hre.ethers.utils.formatEther(presaleBalance), 'NDG');
    console.log('\n🔐 Configuration:');
    console.log('VestingVault presale contract:', presaleContractAddress);
    console.log('Expected presale contract:', PRESALE);
    console.log('Match:', presaleContractAddress === PRESALE);

    console.log('\n🎉 SETUP COMPLETE!\n');
    console.log('='.repeat(60));
    console.log('✅ Contracts are ready for presale!');
    console.log('='.repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
