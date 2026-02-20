// ============================================
// WALLET CONNECTION V2 - STABLE VERSION
// ============================================

let currentProvider = null;
let currentWalletType = null;
let walletConnectProvider = null;
let userAddress = null;

// Contract Configuration
const CHAIN_ID = 97; // BSC Testnet
const CHAIN_ID_HEX = '0x61';
const NETWORK_CONFIG = {
  chainId: CHAIN_ID_HEX,
  chainName: 'BSC Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com']
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Wallet Connect V2 Initialized');
  
  // Attach wallet button click handlers
  const walletButtons = document.querySelectorAll('.wallet-btn[data-wallet]');
  walletButtons.forEach(btn => {
    btn.addEventListener('click', handleWalletClick);
  });

  // QR Back button
  const qrBackBtn = document.getElementById('qr-back-btn');
  if (qrBackBtn) {
    qrBackBtn.addEventListener('click', hideQRCode);
  }

  // Retry button
  const retryBtn = document.getElementById('wallet-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      hideError();
      showWalletOptions();
    });
  }

  // Disconnect button (in step 2)
  const disconnectBtn = document.getElementById('disconnect-wallet');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', disconnectWallet);
  }
});

// ============================================
// WALLET BUTTON CLICK HANDLER
// ============================================
async function handleWalletClick(event) {
  const button = event.currentTarget;
  const walletType = button.getAttribute('data-wallet');
  
  console.log('🔘 Wallet clicked:', walletType);
  
  // Hide wallet options and show loading
  hideWalletOptions();
  showStatus('Connecting to ' + walletType + '...');

  try {
    switch(walletType) {
      case 'metamask':
        await connectMetaMask();
        break;
      case 'trustwallet':
        await connectTrustWallet();
        break;
      case 'coinbase':
        await connectCoinbase();
        break;
      case 'walletconnect':
        await connectWalletConnect();
        break;
      default:
        throw new Error('Unknown wallet type');
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
    showError(error.message);
    showWalletOptions();
  }
}

// ============================================
// METAMASK CONNECTION
// ============================================
async function connectMetaMask() {
  console.log('🦊 Connecting to MetaMask...');

  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask extension.');
  }

  try {
    let provider = window.ethereum;

    // Handle multiple wallets
    if (window.ethereum.providers && window.ethereum.providers.length > 0) {
      provider = window.ethereum.providers.find(p => p.isMetaMask);
      if (!provider) {
        throw new Error('MetaMask not found among installed wallets. Please install MetaMask.');
      }
    } else if (!window.ethereum.isMetaMask) {
      throw new Error('MetaMask not detected. Please install MetaMask extension.');
    }

    console.log('📞 Requesting MetaMask accounts...');
    const accounts = await provider.request({ 
      method: 'eth_requestAccounts' 
    });

    console.log('✅ MetaMask accounts received:', accounts);

    if (!accounts || accounts.length === 0) {
      throw new Error('MetaMask returned no accounts. Please unlock MetaMask and try again.');
    }

    currentProvider = provider;
    currentWalletType = 'metamask';
    userAddress = accounts[0];

    console.log('✅ MetaMask connected:', userAddress);

    await checkAndSwitchNetwork();
    setupProviderListeners();
    hideStatus();
    showPurchaseStep();
    window.dispatchEvent(new CustomEvent('walletConnected'));

  } catch (error) {
    console.error('MetaMask connection error:', error);
    
    if (error.code === -32603 || (error.message && error.message.includes('No active wallet'))) {
      throw new Error('MetaMask is locked. Please open MetaMask extension, unlock it, and try again.');
    } else if (error.code === 4001) {
      throw new Error('You rejected the connection. Please try again and approve in MetaMask.');
    } else if (error.code === -32002) {
      throw new Error('MetaMask is already open. Please check your MetaMask extension and approve the connection.');
    } else if (error.message && error.message.includes('User rejected')) {
      throw new Error('Connection rejected in MetaMask.');
    } else {
      throw new Error('Failed to connect MetaMask: ' + (error.message || 'Please make sure MetaMask is unlocked and try again.'));
    }
  }
}

// ============================================
// TRUST WALLET CONNECTION
// ============================================
async function connectTrustWallet() {
  console.log('🔷 Connecting to Trust Wallet...');

  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet found. Please install Trust Wallet or use WalletConnect on mobile.');
  }

  try {
    let provider = window.ethereum;

    // Try to find Trust Wallet provider
    if (window.ethereum.providers && window.ethereum.providers.length > 0) {
      provider = window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
      
      if (!provider) {
        throw new Error('Trust Wallet not detected. Please use WalletConnect to connect Trust Wallet mobile app.');
      }
    }

    // On desktop without Trust Wallet, suggest WalletConnect
    if (!provider.isTrust && !provider.isTrustWallet && !isMobile()) {
      throw new Error('Trust Wallet is primarily a mobile app. Please click WalletConnect to scan QR code with Trust Wallet mobile.');
    }

    console.log('📞 Requesting Trust Wallet accounts...');
    const accounts = await provider.request({ 
      method: 'eth_requestAccounts' 
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('Trust Wallet returned no accounts. Please unlock Trust Wallet and try again.');
    }

    currentProvider = provider;
    currentWalletType = 'trustwallet';
    userAddress = accounts[0];

    console.log('✅ Trust Wallet connected:', userAddress);

    await checkAndSwitchNetwork();
    setupProviderListeners();
    hideStatus();
    showPurchaseStep();
    window.dispatchEvent(new CustomEvent('walletConnected'));

  } catch (error) {
    console.error('Trust Wallet error:', error);
    
    if (error.code === 4001) {
      throw new Error('Connection rejected in Trust Wallet.');
    } else if (error.message.includes('WalletConnect')) {
      throw error;
    } else {
      throw new Error('Failed to connect Trust Wallet. Please make sure it is unlocked and try again.');
    }
  }
}

// ============================================
// COINBASE WALLET CONNECTION
// ============================================
async function connectCoinbase() {
  console.log('🔵 Connecting to Coinbase Wallet...');

  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet found. Please install Coinbase Wallet extension.');
  }

  try {
    let provider = window.ethereum;

    // Try to find Coinbase Wallet
    if (window.ethereum.providers && window.ethereum.providers.length > 0) {
      provider = window.ethereum.providers.find(p => p.isCoinbaseWallet || p.isWalletLink);
      
      if (!provider) {
        throw new Error('Coinbase Wallet not detected. Please install Coinbase Wallet extension or use another wallet.');
      }
    } else if (!window.ethereum.isCoinbaseWallet && !window.ethereum.isWalletLink) {
      throw new Error('Coinbase Wallet not detected. Please install Coinbase Wallet extension.');
    }

    console.log('📞 Requesting Coinbase Wallet accounts...');
    const accounts = await provider.request({ 
      method: 'eth_requestAccounts' 
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('Coinbase Wallet returned no accounts. Please unlock Coinbase Wallet and try again.');
    }

    currentProvider = provider;
    currentWalletType = 'coinbase';
    userAddress = accounts[0];

    console.log('✅ Coinbase Wallet connected:', userAddress);

    await checkAndSwitchNetwork();
    setupProviderListeners();
    hideStatus();
    showPurchaseStep();
    window.dispatchEvent(new CustomEvent('walletConnected'));

  } catch (error) {
    console.error('Coinbase Wallet error:', error);
    
    if (error.code === 4001) {
      throw new Error('Connection rejected in Coinbase Wallet.');
    } else {
      throw error;
    }
  }
}

// ============================================
// WALLETCONNECT CONNECTION (FIXED - MINIMAL CONFIG)
// ============================================
async function connectWalletConnect() {
  console.log('🔗 Connecting to WalletConnect...');

  try {
    // Check if WalletConnect library is loaded
    if (typeof WalletConnectProvider === 'undefined') {
      throw new Error('WalletConnect library not loaded. Please refresh the page and try again.');
    }

    console.log('✅ WalletConnect library found');

    // Initialize WalletConnect Provider with MINIMAL config (no qrcodeModalOptions)
    walletConnectProvider = new WalletConnectProvider.default({
      rpc: {
        97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        56: 'https://bsc-dataseed.binance.org/'
      },
      chainId: CHAIN_ID
    });

    console.log('✅ WalletConnect Provider initialized');

    // Enable connection (this opens the QR modal automatically)
    const accounts = await walletConnectProvider.enable();

    console.log('✅ WalletConnect accounts received:', accounts);

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please try again.');
    }

    currentProvider = walletConnectProvider;
    currentWalletType = 'walletconnect';
    userAddress = accounts[0];

    console.log('✅ WalletConnect connected:', userAddress);

    // Setup event listeners
    setupWalletConnectListeners();

    // Move to purchase step
    hideStatus();
    showPurchaseStep();
    window.dispatchEvent(new CustomEvent('walletConnected'));

  } catch (error) {
    console.error('WalletConnect error:', error);
    
    if (error && error.message) {
      if (error.message.includes('User closed modal')) {
        throw new Error('Connection cancelled. Please try again.');
      } else if (error.message.includes('not loaded')) {
        throw new Error('WalletConnect library not loaded. Please refresh the page.');
      } else {
        throw new Error('WalletConnect failed: ' + error.message);
      }
    } else {
      throw new Error('WalletConnect connection failed. Please try again.');
    }
  }
}

// ============================================
// NETWORK CHECKING & SWITCHING
// ============================================
async function checkAndSwitchNetwork() {
  try {
    const chainId = await currentProvider.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId, 16);

    console.log('Current Chain ID:', currentChainId, 'Expected:', CHAIN_ID);

    if (currentChainId !== CHAIN_ID) {
      console.log('⚠️ Wrong network, switching to BSC Testnet...');

      try {
        await currentProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_ID_HEX }],
        });

        console.log('✅ Switched to BSC Testnet');

      } catch (switchError) {
        if (switchError.code === 4902) {
          await currentProvider.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });

          console.log('✅ BSC Testnet added and switched');
        } else {
          throw switchError;
        }
      }
    } else {
      console.log('✅ Already on BSC Testnet');
    }
  } catch (error) {
    console.error('Network switch error:', error);
    throw new Error('Please switch to BSC Testnet in your wallet.');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupProviderListeners() {
  if (!currentProvider) return;

  currentProvider.on('accountsChanged', (accounts) => {
    console.log('👤 Accounts changed:', accounts);
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      userAddress = accounts[0];
      updateWalletDisplay();
    }
  });

  currentProvider.on('chainChanged', (chainId) => {
    console.log('🔗 Chain changed:', chainId);
    window.location.reload();
  });

  currentProvider.on('disconnect', () => {
    console.log('🔌 Wallet disconnected');
    disconnectWallet();
  });
}

function setupWalletConnectListeners() {
  if (!walletConnectProvider) return;

  walletConnectProvider.on('accountsChanged', (accounts) => {
    console.log('👤 WalletConnect accounts changed:', accounts);
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      userAddress = accounts[0];
      updateWalletDisplay();
    }
  });

  walletConnectProvider.on('chainChanged', (chainId) => {
    console.log('🔗 WalletConnect chain changed:', chainId);
    window.location.reload();
  });

  walletConnectProvider.on('disconnect', (code, reason) => {
    console.log('🔌 WalletConnect disconnected:', code, reason);
    disconnectWallet();
  });
}

// ============================================
// DISCONNECT WALLET
// ============================================
async function disconnectWallet() {
  console.log('🔌 Disconnecting wallet...');

  if (walletConnectProvider) {
    try {
      await walletConnectProvider.disconnect();
    } catch (error) {
      console.error('Error disconnecting WalletConnect:', error);
    }
    walletConnectProvider = null;
  }

  currentProvider = null;
  currentWalletType = null;
  userAddress = null;

  // Reset UI to wallet selection
  const stepPurchase = document.getElementById('step-purchase');
  const stepWallet = document.getElementById('step-wallet');
  
  if (stepPurchase) stepPurchase.hidden = true;
  if (stepWallet) stepWallet.hidden = false;
  
  showWalletOptions();
  hideStatus();
  hideError();
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================
function showWalletOptions() {
  const optionsList = document.getElementById('wallet-options-list');
  if (optionsList) optionsList.style.display = 'flex';
}

function hideWalletOptions() {
  const optionsList = document.getElementById('wallet-options-list');
  if (optionsList) optionsList.style.display = 'none';
}

function showStatus(message) {
  const statusEl = document.getElementById('wallet-status');
  const statusText = document.getElementById('wallet-status-text');
  if (statusEl && statusText) {
    statusText.textContent = message;
    statusEl.hidden = false;
  }
}

function hideStatus() {
  const statusEl = document.getElementById('wallet-status');
  if (statusEl) statusEl.hidden = true;
}

function showError(message) {
  const errorEl = document.getElementById('wallet-error');
  const errorText = document.getElementById('wallet-error-text');
  if (errorEl && errorText) {
    errorText.textContent = message;
    errorEl.hidden = false;
  }
}

function hideError() {
  const errorEl = document.getElementById('wallet-error');
  if (errorEl) errorEl.hidden = true;
}

function showQRCode() {
  const qrSection = document.getElementById('walletconnect-qr');
  if (qrSection) qrSection.hidden = false;
}

function hideQRCode() {
  const qrSection = document.getElementById('walletconnect-qr');
  if (qrSection) qrSection.hidden = true;
  
  // Clear QR code
  const qrContainer = document.getElementById('qr-code-display');
  if (qrContainer) qrContainer.innerHTML = '';
  
  // Show wallet options again
  showWalletOptions();
}

function showPurchaseStep() {
  const stepWallet = document.getElementById('step-wallet');
  const stepPurchase = document.getElementById('step-purchase');
  
  if (stepWallet) stepWallet.hidden = true;
  if (stepPurchase) stepPurchase.hidden = false;
  
  updateWalletDisplay();
}

function updateWalletDisplay() {
  const walletAddressEl = document.getElementById('wallet-address');
  if (walletAddressEl && userAddress) {
    walletAddressEl.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ============================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ============================================
window.WalletConnect = {
  getProvider: () => currentProvider,
  getAddress: () => userAddress,
  getWalletType: () => currentWalletType,
  isConnected: () => !!userAddress,
  disconnect: disconnectWallet
};

console.log('✅ Wallet Connect V2 loaded successfully');