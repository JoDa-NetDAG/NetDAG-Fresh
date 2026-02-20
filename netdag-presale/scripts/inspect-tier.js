const hre = require('hardhat');

async function main() {
    console.log('🔍 Inspecting PresaleWithVesting Contract...\n');

    const PRESALE = '0x75893CC311530874C52Ec563ed5513FF345311EA';
    const presale = await hre.ethers.getContractAt('PresaleWithVesting', PRESALE);

    console.log('Current Tier:', (await presale.currentTier()).toString(), '\n');

    console.log('Fetching Tier 0 (Tier 1) data...');
    try {
        const tier0 = await presale.tiers(0);
        console.log('Tier 0 raw data:', tier0);
        console.log('Type:', typeof tier0);
        console.log('Is array:', Array.isArray(tier0));
        
        if (Array.isArray(tier0)) {
            console.log('\nArray elements:');
            for (let i = 0; i < tier0.length; i++) {
                console.log('  [' + i + ']:', tier0[i].toString());
            }
        }
    } catch (error) {
        console.error('Error fetching tier:', error.message);
    }

    // Try getting tier details using the getter function
    console.log('\n\nTrying getTierDetails function...');
    try {
        const details = await presale.getTierDetails(0);
        console.log('Tier details:', details);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
