const { ethers } = require('ethers');

// Read the private key from transfer.js
const fs = require('fs');
const transferCode = fs.readFileSync('scripts/transfer.js', 'utf8');
const match = transferCode.match(/const oldKey = '(0x[a-fA-F0-9]+)'/);

if (!match) {
    console.log('❌ Could not find private key in transfer.js');
    process.exit(1);
}

const privateKey = match[1];

try {
    const wallet = new ethers.Wallet(privateKey);
    
    console.log('✅ Valid private key!');
    console.log('Address:', wallet.address);
    console.log('');
    console.log('Expected old address: 0x8834aa98987c170c0f36e087a7ffa08070c1ad4b');
    console.log('');
    
    if (wallet.address.toLowerCase() === '0x8834aa98987c170c0f36e087a7ffa08070c1ad4b'.toLowerCase()) {
        console.log('✅ CORRECT! Ready to transfer!');
    } else {
        console.log('❌ WRONG ADDRESS! This private key generates:', wallet.address);
    }
    
} catch (error) {
    console.log('❌ INVALID PRIVATE KEY!');
    console.log('Error:', error.message);
}