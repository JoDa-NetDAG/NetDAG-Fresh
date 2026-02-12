// wallet/wallet-connect.js
// Handles wallet connection with BNB Chain support

import { CONTRACT_CONFIG, NETWORK_CONFIG } from '../config/contract-config. js';

let userAddress = null;
let isConnected = false;

export async function initWallet() {
    console.log('Initializing wallet connection...');
    
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });
            
            if (accounts.length > 0) {
                await handleAccountsChanged(accounts);
            }
        } catch (error) {
            console.error('Error checking wallet:', error);
        }
        
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or another Web3 wallet!');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }
    
    try {
        // Request access to wallet
        const accounts = await window. ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        await handleAccountsChanged(accounts);
        
        // Check if user is on correct network
        await checkAndSwitchNetwork();
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        
        if (error.code === 4001) {
            alert('You rejected the connection request');
        } else {
            alert('Failed to connect wallet.  Please try again.');
        }
    }
}

// Check if user is on BNB Chain, if not, ask to switch
async function checkAndSwitchNetwork() {
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainId, 16);
        
        if (currentChainId !== CONTRACT_CONFIG.CHAIN_ID) {
            console.log(`Wrong network detected. Current: ${currentChainId}, Expected: ${CONTRACT_CONFIG.CHAIN_ID}`);
            
            try {
                // Try to switch to BNB Chain
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId:  NETWORK_CONFIG.chainId }],
                });
                
                console.log('✅ Switched to BNB Chain');
                
            } catch (switchError) {
                // If BNB Chain is not added to MetaMask, add it
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [NETWORK_CONFIG],
                        });
                        
                        console.log('✅ BNB Chain added and switched');
                        
                    } catch (addError) {
                        console.error('Error adding BNB Chain:', addError);
                        alert('Please add BNB Chain to your wallet manually');
                    }
                } else {
                    console.error('Error switching network:', switchError);
                    alert('Please switch to BNB Chain manually');
                }
            }
        } else {
            console.log('✅ Already on BNB Chain');
        }
        
    } catch (error) {
        console.error('Error checking network:', error);
    }
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        userAddress = null;
        isConnected = false;
        updateWalletUI();
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
        
    } else {
        userAddress = accounts[0];
        isConnected = true;
        updateWalletUI();
        
        console.log('✅ Wallet connected:', userAddress);
        
        window.dispatchEvent(new CustomEvent('walletConnected', { 
            detail: { address: userAddress } 
        }));
    }
}

function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const walletStatus = document.getElementById('walletStatus');
    
    if (connectBtn) {
        if (isConnected) {
            connectBtn.textContent = `${userAddress. slice(0, 6)}...${userAddress.slice(-4)}`;
            connectBtn.classList.add('connected');
        } else {
            connectBtn. textContent = 'Connect Wallet';
            connectBtn.classList.remove('connected');
        }
    }
    
    if (walletStatus) {
        if (isConnected) {
            walletStatus.innerHTML = `<p>Wallet:  ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}</p>`;
        } else {
            walletStatus.innerHTML = `<p>Wallet: Not connected</p>`;
        }
    }
}

export function getUserAddress() {
    return userAddress;
}

export function getIsConnected() {
    return isConnected;
}