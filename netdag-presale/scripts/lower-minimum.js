const hre = require('hardhat');

async function main() {
    console.log('🔧 Lowering minimum contribution for testing...\n');

    const PRESALE = '0x75893CC311530874C52Ec563ed5513FF345311EA';
    const presale = await hre.ethers.getContractAt('PresaleWithVesting', PRESALE);

    console.log('Current limits:');
    const minUSD = await presale.minContributionUSD();
    const maxUSD = await presale.maxContributionUSD();
    console.log('Min:', hre.ethers.utils.formatEther(minUSD), 'USD');
    console.log('Max:', hre.ethers.utils.formatEther(maxUSD), 'USD\n');

    console.log('Setting new limits:');
    console.log('Min: 1 USD (for testing)');
    console.log('Max: 100,000 USD\n');

    const newMin = hre.ethers.utils.parseEther('1');
    const newMax = hre.ethers.utils.parseEther('100000');

    const tx = await presale.setContributionLimits(newMin, newMax);
    console.log('TX:', tx.hash);
    await tx.wait();
    console.log('✅ Limits updated!\n');

    const afterMin = await presale.minContributionUSD();
    const afterMax = await presale.maxContributionUSD();
    console.log('New limits:');
    console.log('Min:', hre.ethers.utils.formatEther(afterMin), 'USD');
    console.log('Max:', hre.ethers.utils.formatEther(afterMax), 'USD');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
