const hre = require('hardhat');

async function main() {
    console.log('🔍 Inspecting PresaleWithVesting Contract Functions...\n');

    const PRESALE = '0x75893CC311530874C52Ec563ed5513FF345311EA';
    const presale = await hre.ethers.getContractAt('PresaleWithVesting', PRESALE);

    console.log('Available functions:');
    const iface = presale.interface;
    
    const functions = Object.keys(iface.functions);
    console.log('\nAll functions found:');
    functions.forEach(func => {
        console.log('  -', func);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
