const { ethers } = require('ethers');

const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const address = '0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B';

const provider = new ethers.providers.JsonRpcProvider(rpc);

provider.getBalance(address).then(balance => {
    const bnb = ethers.utils.formatEther(balance);
    console.log('Address:', address);
    console.log('Balance:', bnb, 'tBNB');
    console.log('');
    if (parseFloat(bnb) < 0.1) {
        console.log('⚠️  Need testnet BNB! Balance too low.');
        console.log('✅ Next: Get tBNB from faucet');
    } else {
        console.log('✅ Balance OK! Ready to deploy!');
    }
});
