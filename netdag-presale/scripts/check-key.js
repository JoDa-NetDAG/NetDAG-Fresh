const { ethers } = require('ethers');

const privateKey = '0xab1844df65612850be49bfaaf5a997372ac64e8db4d79cad7a8af8f69a29af6c';

try {
    const wallet = new ethers.Wallet(privateKey);
    console.log('✅ Private key generates address:', wallet.address);
    console.log('');
    console.log('Check if this matches one of your 7 MetaMask accounts:');
    console.log('1. 0x8834A.....');
    console.log('2. 0x155ad.....');
    console.log('3. 0x53AcD.....');
    console.log('4. 0xa66ob.....');
    console.log('5. 0xF6b3c.....');
    console.log('6. 0x65007.....');
    console.log('7. 0x9C023.....');
} catch (error) {
    console.log('❌ Error:', error.message);
}
