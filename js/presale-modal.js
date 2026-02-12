// ============================================
// PRESALE MODAL - NetDAG
// Price: $0.025 per NDG
// ============================================

const PRESALE_CONFIG = {
  currentPrice: 0.025,
  nextPrice: 0.030,
  tierEndDate: new Date('2026-02-14T00:00:00Z'),
  minBNB: 0.1,
  maxBNB: 100,
  minUSD: 50,
  maxUSD: 50000,
  prices: {
    BNB: 600,
    USDT: 1,
    USDC: 1
  },
  network: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorer: 'https://bscscan.com'
  }
};

let walletConnected = false;
let userAddress = null;
let selectedCurrency = 'BNB';
let countdownInterval = null;

// ============================================
// MODAL CONTROLS
// ============================================

function openPresaleModal() {
  const modal = document.getElementById('presale-modal');
  if (!modal) return;
  
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  resetModalToStep1();
  startCountdown();
}

function closePresaleModal() {
  const modal = document.getElementById('presale-modal');
  if (!modal) return;
  
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  if (countdownInterval) clearInterval(countdownInterval);
}

function showStep(stepId) {
  document.querySelectorAll('.presale-step').forEach(step => {
    step.setAttribute('hidden', '');
  });
  
  const step = document.getElementById(stepId);
  if (step) step.removeAttribute('hidden');
}

function resetModalToStep1() {
  showStep('step-wallet');
  walletConnected = false;
  userAddress = null;
}

// ============================================
// COUNTDOWN TIMER
// ============================================

function startCountdown() {
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date().getTime();
  const distance = PRESALE_CONFIG.tierEndDate.getTime() - now;
  
  if (distance < 0) {
    clearInterval(countdownInterval);
    setTextContent('days', '00');
    setTextContent('hours', '00');
    setTextContent('minutes', '00');
    setTextContent('seconds', '00');
    return;
  }
  
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  setTextContent('days', String(days).padStart(2, '0'));
  setTextContent('hours', String(hours).padStart(2, '0'));
  setTextContent('minutes', String(minutes).padStart(2, '0'));
  setTextContent('seconds', String(seconds).padStart(2, '0'));
}

// ============================================
// WALLET CONNECTION
// ============================================

async function connectWallet(walletType) {
  try {
    if (walletType === 'metamask') {
      await connectMetaMask();
    } else {
      alert(walletType.charAt(0).toUpperCase() + walletType.slice(1) + ' integration coming soon!');
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    showError(error.message || 'Failed to connect wallet');
  }
}

async function connectMetaMask() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  userAddress = accounts[0];
  
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== PRESALE_CONFIG.network.chainId) {
    await switchNetwork();
  }
  
  walletConnected = true;
  updateWalletUI();
  showStep('step-purchase');
}

async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: PRESALE_CONFIG.network.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: PRESALE_CONFIG.network.chainId,
          chainName: PRESALE_CONFIG.network.chainName,
          rpcUrls: [PRESALE_CONFIG.network.rpcUrl],
          blockExplorerUrls: [PRESALE_CONFIG.network.blockExplorer]
        }]
      });
    } else {
      throw switchError;
    }
  }
}

function updateWalletUI() {
  if (userAddress) {
    const short = userAddress.substring(0, 6) + '...' + userAddress.substring(38);
    setTextContent('wallet-address', short);
  }
}

function disconnectWallet() {
  walletConnected = false;
  userAddress = null;
  resetModalToStep1();
}

// ============================================
// CURRENCY SELECTION & CALCULATION
// ============================================

function updateSelectedCurrency(currency) {
  selectedCurrency = currency;
  
  setTextContent('selected-currency', currency);
  setTextContent('limit-currency', currency);
  setTextContent('summary-currency', currency);
  
  document.querySelectorAll('.quick-currency').forEach(el => {
    el.textContent = currency;
  });
  
  if (currency === 'BNB') {
    setTextContent('min-amount', PRESALE_CONFIG.minBNB);
    setTextContent('max-amount', PRESALE_CONFIG.maxBNB);
  } else {
    setTextContent('min-amount', PRESALE_CONFIG.minUSD);
    setTextContent('max-amount', PRESALE_CONFIG.maxUSD);
  }
  
  calculateNDG();
}

function calculateNDG() {
  const payInput = document.getElementById('pay-amount');
  if (!payInput) return;
  
  const payAmount = parseFloat(payInput.value) || 0;
  
  if (payAmount <= 0) {
    setTextContent('receive-amount', '0');
    setTextContent('usd-value', '0.00');
    setTextContent('exchange-rate', '0');
    return;
  }
  
  const usdValue = payAmount * PRESALE_CONFIG.prices[selectedCurrency];
  const ndgAmount = usdValue / PRESALE_CONFIG.currentPrice;
  const exchangeRate = PRESALE_CONFIG.prices[selectedCurrency] / PRESALE_CONFIG.currentPrice;
  
  setTextContent('receive-amount', formatNumber(ndgAmount));
  setTextContent('usd-value', usdValue.toFixed(2));
  setTextContent('exchange-rate', formatNumber(exchangeRate));
  
  validateAmount(payAmount);
}

function validateAmount(amount) {
  const btn = document.getElementById('btn-purchase');
  if (!btn) return;
  
  let min = selectedCurrency === 'BNB' ? PRESALE_CONFIG.minBNB : PRESALE_CONFIG.minUSD;
  let max = selectedCurrency === 'BNB' ? PRESALE_CONFIG.maxBNB : PRESALE_CONFIG.maxUSD;
  
  if (amount < min || amount > max) {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-text">Amount must be ' + min + '-' + max + ' ' + selectedCurrency + '</span>';
  } else {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-text">Confirm Purchase</span><i class="fas fa-arrow-right"></i>';
  }
}

function setQuickAmount(amount) {
  const payInput = document.getElementById('pay-amount');
  if (payInput) {
    payInput.value = amount;
    calculateNDG();
  }
}

// ============================================
// PURCHASE FLOW
// ============================================

async function executePurchase() {
  const payInput = document.getElementById('pay-amount');
  if (!payInput) return;
  
  const payAmount = parseFloat(payInput.value);
  const receiveAmountText = document.getElementById('receive-amount').textContent.replace(/,/g, '');
  const receiveAmount = parseFloat(receiveAmountText);
  
  if (!payAmount || payAmount <= 0) {
    showError('Please enter a valid amount');
    return;
  }
  
  showStep('step-processing');
  setTextContent('tx-amount', payAmount);
  setTextContent('tx-currency', selectedCurrency);
  setTextContent('tx-ndg', formatNumber(receiveAmount));
  
  try {
    const txHash = await simulatePurchase(payAmount);
    showSuccess(payAmount, receiveAmount, txHash);
  } catch (error) {
    console.error('Purchase error:', error);
    showError(error.message || 'Transaction failed. Please try again.');
  }
}

async function simulatePurchase(amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) {
        const fakeTxHash = '0x' + Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        resolve(fakeTxHash);
      } else {
        reject(new Error('Transaction rejected by user'));
      }
    }, 3000);
  });
}

function showSuccess(paidAmount, receivedNDG, txHash) {
  showStep('step-success');
  
  setTextContent('success-paid', paidAmount);
  setTextContent('success-currency', selectedCurrency);
  setTextContent('success-ndg', formatNumber(receivedNDG));
  
  const shortHash = txHash.substring(0, 10) + '...' + txHash.substring(58);
  setTextContent('tx-hash', shortHash);
  
  const bscscanLink = PRESALE_CONFIG.network.blockExplorer + '/tx/' + txHash;
  const viewLink = document.getElementById('view-bscscan');
  if (viewLink) viewLink.href = bscscanLink;
}

function showError(message) {
  showStep('step-error');
  setTextContent('error-message', message);
}

function buyMore() {
  showStep('step-purchase');
  const payInput = document.getElementById('pay-amount');
  if (payInput) payInput.value = '';
  calculateNDG();
}

function tryAgain() {
  showStep('step-purchase');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setTextContent(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatNumber(num) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Open modal
  document.querySelectorAll('[data-open-presale]').forEach(btn => {
    btn.addEventListener('click', openPresaleModal);
  });
  
  // Close modal
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closePresaleModal);
  });
  
  // Wallet buttons
  document.querySelectorAll('.wallet-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      connectWallet(this.dataset.wallet);
    });
  });
  
  // Disconnect
  const disconnectBtn = document.getElementById('disconnect-wallet');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', disconnectWallet);
  }
  
  // Currency selection
  document.querySelectorAll('input[name="currency"]').forEach(radio => {
    radio.addEventListener('change', function() {
      updateSelectedCurrency(this.value);
    });
  });
  
  // Amount input
  const payInput = document.getElementById('pay-amount');
  if (payInput) {
    payInput.addEventListener('input', calculateNDG);
  }
  
  // Quick amount buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      setQuickAmount(parseFloat(this.dataset.amount));
    });
  });
  
  // Purchase button
  const purchaseBtn = document.getElementById('btn-purchase');
  if (purchaseBtn) {
    purchaseBtn.addEventListener('click', executePurchase);
  }
  
  // Buy more
  const buyMoreBtn = document.getElementById('btn-buy-more');
  if (buyMoreBtn) {
    buyMoreBtn.addEventListener('click', buyMore);
  }
  
  // Try again
  const tryAgainBtn = document.getElementById('btn-try-again');
  if (tryAgainBtn) {
    tryAgainBtn.addEventListener('click', tryAgain);
  }
  
  // ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('presale-modal');
      if (modal && !modal.hasAttribute('hidden')) {
        closePresaleModal();
      }
    }
  });
  
});