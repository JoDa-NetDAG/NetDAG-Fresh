const { ethers } = require('ethers');

const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const address = '0x8834aa98987c170c0f36e087a7ffa08070c1ad4b';

const provider = new ethers.providers.JsonRpcProvider(rpc);

provider.getBalance(address).then(balance => {
    const bnb = ethers.utils.formatEther(balance);
    console.log('Address:', address);
    console.log('Balance:', bnb, 'tBNB');
    console.log('');
    if (parseFloat(bnb) >= 0.1) {
        console.log('✅ This address has tBNB!');
        console.log('✅ We can use this address for deployment instead!');
    } else {
        console.log('⚠️  Balance too low.');
    }
});
