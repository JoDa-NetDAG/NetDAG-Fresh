// ============================================
// PRESALE MODAL - NetDAG (Purchase Logic Only)
// Works with wallet-connect-v2.js
// ============================================ 

const PRESALE_CONFIG = {
  currentPrice: 0.006, // FIXED - was 0.025, now correct Tier 1 price
  nextPrice: 0.009,
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
    chainId: '0x61',
    chainName: 'BNB Smart Chain Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: 'https://testnet.bscscan.com'
  }
};

const PRESALE_CONTRACT = '0xc4dECFe3a1d7273049C4e86eD3Da25C335Cb0342'; // UPDATED
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

let selectedCurrency = 'BNB';
let countdownInterval = null;
let referrerAddress = null;

// ============================================
// MODAL CONTROLS
// ============================================

function checkReferrer() {
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');

  if (ref && ethers && ethers.utils && ethers.utils.isAddress(ref)) {
    referrerAddress = ref;
    showReferrerBanner(ref);
  } else if (ref) {
    console.warn('Invalid referrer address format:', ref);
  }
}

function showReferrerBanner(address) {
  const modal = document.getElementById('presale-modal');
  if (!modal) return;

  const purchaseContainer = modal.querySelector('.presale-modal-content');
  if (!purchaseContainer) return;

  if (purchaseContainer.querySelector('.referral-banner')) return;

  const banner = document.createElement('div');
  banner.className = 'referral-banner';
  banner.innerHTML = `
    <div class="referral-badge">
      🎁 You were referred by: ${address.slice(0, 6)}...${address.slice(-4)}
      <span class="bonus-tag">+5% Bonus for Referrer</span>
    </div>
  `;

  const header = purchaseContainer.querySelector('.presale-header');
  if (header && header.nextSibling) {
    purchaseContainer.insertBefore(banner, header.nextSibling);
  } else {
    purchaseContainer.prepend(banner);
  }
}

function openPresaleModal() {
  const modal = document.getElementById('presale-modal');
  if (!modal) return;

  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  
  // Check if wallet already connected
  if (window.WalletConnect && window.WalletConnect.isConnected()) {
    showPurchaseStep();
    updateWalletDisplayFromConnected();
  } else {
    showStep('step-wallet');
  }
  
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

function showPurchaseStep() {
  showStep('step-purchase');
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
// WALLET UI UPDATE (uses wallet-connect-v2.js)
// ============================================

function updateWalletDisplayFromConnected() {
  if (window.WalletConnect && window.WalletConnect.isConnected()) {
    const address = window.WalletConnect.getAddress();
    if (address) {
      const short = address.substring(0, 6) + '...' + address.substring(38);
      setTextContent('wallet-address', short);
      generateReferralLink(address);
    }
  }
}

function generateReferralLink(address) {
  const baseUrl = window.location.origin + window.location.pathname;
  const referralLink = `${baseUrl}?ref=${address}`;

  const linkInput = document.getElementById('referral-link');
  if (linkInput) {
    linkInput.value = referralLink;
  }

  const referralSection = document.getElementById('referral-section');
  if (referralSection) {
    referralSection.style.display = 'block';
  }
}

function copyReferralLink(event) {
  const input = document.getElementById('referral-link');
  if (!input) return;

  const linkValue = input.value;
  const button = event?.currentTarget;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(linkValue).then(() => {
      showCopySuccess(button);
    }).catch(() => {
      fallbackCopy(input, button);
    });
  } else {
    fallbackCopy(input, button);
  }
}

function fallbackCopy(input, button) {
  try {
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    showCopySuccess(button);
  } catch (err) {
    console.error('Copy failed:', err);
    input.select();
  }
}

function showCopySuccess(button) {
  if (!button) return;

  const originalText = button.textContent;
  const originalBg = button.style.background;
  
  button.textContent = '✅ Copied!';
  button.style.background = '#00cc00';

  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = originalBg;
  }, 2000);
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
    alert('Please enter a valid amount');
    return;
  }

  showStep('step-processing');
  setTextContent('tx-amount', payAmount);
  setTextContent('tx-currency', selectedCurrency);
  setTextContent('tx-ndg', formatNumber(receiveAmount));

  try {
    const referrer = referrerAddress || ZERO_ADDRESS;
    const txHash = await simulatePurchase(payAmount);
    showSuccess(payAmount, receiveAmount, txHash);
  } catch (error) {
    console.error('Purchase error:', error);
    showErrorStep(error.message || 'Transaction failed. Please try again.');
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

function showErrorStep(message) {
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
  console.log('📋 Presale Modal initialized');

  checkReferrer();

  // Listen for wallet connection from wallet-connect-v2.js
  window.addEventListener('walletConnected', function() {
    console.log('✅ Wallet connected event received');
    showPurchaseStep();
    updateWalletDisplayFromConnected();
  });

  // Copy referral link
  const copyReferralBtn = document.getElementById('copy-referral-btn');
  if (copyReferralBtn) {
    copyReferralBtn.addEventListener('click', copyReferralLink);
  }

  // Open modal
  document.querySelectorAll('[data-open-presale]').forEach(btn => {
    btn.addEventListener('click', openPresaleModal);
  });

  // Close modal
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closePresaleModal);
  });

  // Disconnect (calls wallet-connect-v2.js disconnect)
  const disconnectBtn = document.getElementById('disconnect-wallet');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', function() {
      if (window.WalletConnect && window.WalletConnect.disconnect) {
        window.WalletConnect.disconnect();
      }
      showStep('step-wallet');
    });
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