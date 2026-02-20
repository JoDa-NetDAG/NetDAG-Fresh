const { ethers } = require('ethers');

async function transfer() {
    const provider = new ethers.providers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
    
    // OLD wallet private key
    const oldKey = '0xc418619dd4a37456d4e73e13182ebf268d93dfad1187e235c9bed2b77db312a6';
    const oldWallet = new ethers.Wallet(oldKey, provider);
    
    const newAddress = '0x78C496Bb2d5241fce972C8f6fe606AA8EAabf2d7';
    
    console.log('From:', oldWallet.address);
    console.log('To:', newAddress);
    
    const balance = await provider.getBalance(oldWallet.address);
    console.log('Balance:', ethers.utils.formatEther(balance), 'BNB');
    
    // Send 90% (keep some for gas)
    const amountToSend = balance.mul(90).div(100);
    
    console.log('Sending:', ethers.utils.formatEther(amountToSend), 'BNB...');
    
    const tx = await oldWallet.sendTransaction({
        to: newAddress,
        value: amountToSend
    });
    
    console.log('TX:', tx.hash);
    await tx.wait();
    
    console.log('✅ Done!');
    
    const newBalance = await provider.getBalance(newAddress);
    console.log('New balance:', ethers.utils.formatEther(newBalance), 'BNB');
}

transfer().catch(console.error);