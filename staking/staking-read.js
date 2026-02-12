// staking/staking-read.js
// Reads staking data from the blockchain (doesn't cost gas)

import { CONTRACT_CONFIG } from '../config/contract-config.js';
import { STAKING_ABI } from './staking-abi.js';
import { getUserAddress, getIsConnected } from '../wallet/wallet-connect.js';

export function initStakingRead() {
    console.log('Initializing staking read functions...');
    
    // Load data when wallet connects
    window.addEventListener('walletConnected', loadStakingData);
    
    // Clear data when wallet disconnects
    window.addEventListener('walletDisconnected', clearStakingData);
    
    // If wallet is already connected, load data now
    if (getIsConnected()) {
        loadStakingData();
    }
}

async function loadStakingData() {
    const address = getUserAddress();
    
    if (!address) {
        console.log('No wallet connected, skipping staking data load');
        return;
    }
    
    console.log('Loading staking data for:', address);
    
    try {
        // For now, show placeholder data
        // You'll replace this with actual blockchain calls later
        
        const stakedAmountElement = document.getElementById('stakedAmount');
        const rewardsAmountElement = document.getElementById('rewardsAmount');
        
        if (stakedAmountElement) {
            stakedAmountElement.textContent = '0 NDAG (Loading...)';
        }
        
        if (rewardsAmountElement) {
            rewardsAmountElement.textContent = '0 NDAG (Loading...)';
        }
        
        // TODO: Add actual blockchain reading code here
        // Example: 
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        // const contract = new ethers.Contract(CONTRACT_CONFIG.STAKING_CONTRACT, STAKING_ABI, provider);
        // const balance = await contract.balanceOf(address);
        
    } catch (error) {
        console.error('Error loading staking data:', error);
    }
}

function clearStakingData() {
    const stakedAmountElement = document. getElementById('stakedAmount');
    const rewardsAmountElement = document.getElementById('rewardsAmount');
    
    if (stakedAmountElement) {
        stakedAmountElement.textContent = '0 NDAG';
    }
    
    if (rewardsAmountElement) {
        rewardsAmountElement.textContent = '0 NDAG';
    }
}