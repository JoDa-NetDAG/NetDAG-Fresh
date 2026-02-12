// staking/staking-write.js
// Handles staking actions (stake, withdraw, claim) - these cost gas

import { CONTRACT_CONFIG } from '../config/contract-config.js';
import { STAKING_ABI } from './staking-abi.js';
import { getUserAddress, getIsConnected } from '../wallet/wallet-connect.js';

export function initStakingWrite() {
    console.log('Initializing staking write functions...');
    
    // Set up button click handlers
    setupStakingButtons();
}

function setupStakingButtons() {
    const stakeBtn = document.getElementById('stakeBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const claimBtn = document.getElementById('claimBtn');
    
    if (stakeBtn) {
        stakeBtn. addEventListener('click', handleStake);
    }
    
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', handleWithdraw);
    }
    
    if (claimBtn) {
        claimBtn. addEventListener('click', handleClaim);
    }
}

async function handleStake() {
    if (!getIsConnected()) {
        alert('Please connect your wallet first!');
        return;
    }
    
    // Ask user how much to stake
    const amount = prompt('How many NDAG tokens do you want to stake?');
    
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    console.log(`User wants to stake:  ${amount} NDAG`);
    
    try {
        // TODO: Add actual staking transaction code here
        alert(`Staking feature coming soon!\nYou requested to stake:  ${amount} NDAG`);
        
        // Example of what the real code would look like:
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        // const signer = provider.getSigner();
        // const contract = new ethers.Contract(CONTRACT_CONFIG. STAKING_CONTRACT, STAKING_ABI, signer);
        // const tx = await contract. stake(ethers.utils.parseEther(amount));
        // await tx.wait();
        
    } catch (error) {
        console.error('Error staking:', error);
        alert('Failed to stake. Check console for details.');
    }
}

async function handleWithdraw() {
    if (!getIsConnected()) {
        alert('Please connect your wallet first!');
        return;
    }
    
    const amount = prompt('How many NDAG tokens do you want to withdraw? ');
    
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    console. log(`User wants to withdraw: ${amount} NDAG`);
    
    try {
        // TODO: Add actual withdraw transaction code here
        alert(`Withdraw feature coming soon!\nYou requested to withdraw: ${amount} NDAG`);
        
    } catch (error) {
        console.error('Error withdrawing:', error);
        alert('Failed to withdraw. Check console for details.');
    }
}

async function handleClaim() {
    if (!getIsConnected()) {
        alert('Please connect your wallet first! ');
        return;
    }
    
    console.log('User wants to claim rewards');
    
    try {
        // TODO:  Add actual claim transaction code here
        alert('Claim rewards feature coming soon! ');
        
    } catch (error) {
        console.error('Error claiming rewards:', error);
        alert('Failed to claim rewards. Check console for details.');
    }
}