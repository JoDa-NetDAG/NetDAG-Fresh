const hre = require('hardhat');

async function main() {
    const PRESALE = '0x75893CC311530874C52Ec563ed5513FF345311EA';
    const presale = await hre.ethers.getContractAt('PresaleWithVesting', PRESALE);

    const minUSD = await presale.minContributionUSD();
    const maxUSD = await presale.maxContributionUSD();
    
    console.log('Minimum Contribution:', hre.ethers.utils.formatEther(minUSD), 'USD');
    console.log('Maximum Contribution:', hre.ethers.utils.formatEther(maxUSD), 'USD');
    
    const bnbAmount = hre.ethers.utils.parseEther('0.01');
    const preview = await presale.previewPurchase(bnbAmount);
    console.log('\n0.01 BNB =', hre.ethers.utils.formatEther(preview[0]), 'USD');
    console.log('This is BELOW the minimum of', hre.ethers.utils.formatEther(minUSD), 'USD');
    
    console.log('\n💡 Solution: Use more BNB (at least 0.1 BNB)');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
