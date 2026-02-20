// ============================================================
// NetDAG Presale - Contract Configuration
// BSC Testnet Deployment
// ============================================================

const CONTRACT_CONFIG = {
  // Network Settings
  NETWORK: 'bscTestnet',
  CHAIN_ID: 97,
  RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  BLOCK_EXPLORER: 'https://testnet.bscscan.com',
  
  // Contract Addresses (NEW DEPLOYMENT)
  NDG_TOKEN: '0xF0aA1382aac4bA2b1EFFc954eCB9Ca2112bfdC7E',
  PRESALE_CONTRACT: '0xc4dECFe3a1d7273049C4e86eD3Da25C335Cb0342',
  VESTING_VAULT: '0xc60E5785c4f64EF814066581A319B67310c98C3C',
  
  // Oracle & Price Feeds
  BNB_PRICE_FEED: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526', // Chainlink BNB/USD
  
  // Accepted Payment Tokens
  ACCEPTED_STABLECOINS: {
    USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    USDC: '0x64544969ed7EBf5f083679233325356EbE738930'
  },
  
  // Presale Parameters
  PRESALE_SETTINGS: {
    ANCHOR_PRICE: '0.01', // $0.01 USD
    MIN_CONTRIBUTION_USD: 50, // $50 minimum
    MAX_CONTRIBUTION_USD: 1000000, // $1M maximum per wallet
    TOTAL_PRESALE_ALLOCATION: '600000000', // 600M NDG tokens
    PRESALE_DURATION_DAYS: 270, // 9 months
    TIER_DURATION_DAYS: 30 // 30 days per tier
  },
  
  // Tier Pricing (9 tiers)
  TIERS: [
    { tier: 1, price: '0.006', allocation: '108000000', discount: '40%' },
    { tier: 2, price: '0.009', allocation: '96000000', discount: '10%' },
    { tier: 3, price: '0.013', allocation: '84000000', premium: '30%' },
    { tier: 4, price: '0.017', allocation: '72000000', premium: '70%' },
    { tier: 5, price: '0.021', allocation: '60000000', premium: '110%' },
    { tier: 6, price: '0.025', allocation: '60000000', premium: '150%' },
    { tier: 7, price: '0.028', allocation: '48000000', premium: '180%' },
    { tier: 8, price: '0.12', allocation: '42000000', premium: '1100%' },
    { tier: 9, price: '0.16', allocation: '30000000', premium: '1500%' }
  ],
  
  // Vesting Settings
  VESTING: {
    IMMEDIATE_PERCENT: 40, // 40% at TGE
    VESTING_PERCENT: 60, // 60% vested quarterly
    DEFAULT_CLIFF_MONTHS: 12, // 12 months default
    QUARTER_1_DAYS: 91, // 3 months - 20% release
    QUARTER_2_DAYS: 182, // 6 months - 20% release
    QUARTER_3_DAYS: 274 // 9 months - 20% release
  },
  
  // Early Access Tiers (unlock before TGE)
  EARLY_ACCESS: {
    TIER_1: { hours: 3, fee: 100 }, // 3 hours early, $100
    TIER_2: { hours: 6, fee: 200 }, // 6 hours early, $200
    TIER_3: { hours: 9, fee: 250 }  // 9 hours early, $250
  },
  
  // Cliff Reduction Fees (reduce vesting cliff)
  CLIFF_REDUCTION: {
    TO_9_MONTHS: { months: 9, fee: 300 }, // Reduce to 9 months, $300
    TO_6_MONTHS: { months: 6, fee: 500 }, // Reduce to 6 months, $500
    TO_3_MONTHS: { months: 3, fee: 750 }  // Reduce to 3 months, $750
  },
  
  // Referral System
  REFERRAL: {
    BONUS_PERCENT: 5, // 5% bonus for referrer
    ENABLED: true
  },
  
  // Token Information
  TOKEN_INFO: {
    NAME: 'NetDAG',
    SYMBOL: 'NDG',
    DECIMALS: 18,
    TOTAL_SUPPLY: '1000000000', // 1 billion
    PRESALE_ALLOCATION: '600000000' // 600M for presale (60%)
  },
  
  // Wallet Addresses
  WALLETS: {
    DEPLOYER: '0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B',
    TREASURY: '0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B',
    LIQUIDITY_FUND: '0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B'
  },
  
  // Contract ABIs (paths to ABI files)
  ABIS: {
    NDG_TOKEN: './artifacts/contracts/NDGToken.sol/NDGToken.json',
    PRESALE: './artifacts/contracts/PresaleWithVesting.sol/PresaleWithVesting.json',
    VESTING_VAULT: './artifacts/contracts/VestingVault.sol/VestingVault.json',
    ERC20: './artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json'
  },
  
  // Gas Settings
  GAS: {
    PRICE_GWEI: 10, // 10 Gwei
    LIMIT_MULTIPLIER: 1.2 // 20% buffer
  },
  
  // Frontend URLs
  URLS: {
    WEBSITE: 'https://netdag.io',
    DOCS: 'https://docs.netdag.io',
    TELEGRAM: 'https://t.me/netdag',
    TWITTER: 'https://twitter.com/netdag'
  },
  
  // Feature Flags
  FEATURES: {
    BNB_PAYMENT: true,
    STABLECOIN_PAYMENT: true,
    REFERRAL_SYSTEM: true,
    EARLY_ACCESS: true,
    CLIFF_REDUCTION: true,
    AUTO_TIER_ADVANCE: true
  },
  
  // Display Settings
  DISPLAY: {
    PRICE_DECIMALS: 6, // Show 6 decimal places for prices
    TOKEN_DECIMALS: 2, // Show 2 decimal places for token amounts
    USD_DECIMALS: 2 // Show 2 decimal places for USD amounts
  }
};

// Helper Functions
const HELPERS = {
  /**
   * Get contract address by name
   */
  getContractAddress(contractName) {
    const addresses = {
      'NDG': CONTRACT_CONFIG.NDG_TOKEN,
      'PRESALE': CONTRACT_CONFIG.PRESALE_CONTRACT,
      'VAULT': CONTRACT_CONFIG.VESTING_VAULT,
      'USDT': CONTRACT_CONFIG.ACCEPTED_STABLECOINS.USDT,
      'USDC': CONTRACT_CONFIG.ACCEPTED_STABLECOINS.USDC
    };
    return addresses[contractName.toUpperCase()];
  },
  
  /**
   * Get block explorer URL for address
   */
  getExplorerUrl(address, type = 'address') {
    return `${CONTRACT_CONFIG.BLOCK_EXPLORER}/${type}/${address}`;
  },
  
  /**
   * Get current tier info
   */
  getTierInfo(tierIndex) {
    return CONTRACT_CONFIG.TIERS[tierIndex];
  },
  
  /**
   * Calculate tokens for USD amount at specific tier
   */
  calculateTokens(usdAmount, tierPrice) {
    return (parseFloat(usdAmount) / parseFloat(tierPrice)).toFixed(2);
  },
  
  /**
   * Format token amount with decimals
   */
  formatTokenAmount(amount, decimals = 2) {
    return parseFloat(amount).toFixed(decimals);
  },
  
  /**
   * Format USD amount
   */
  formatUSD(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
  }
};

// Export for Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONTRACT_CONFIG, HELPERS };
}

// Export for Browser (frontend)
if (typeof window !== 'undefined') {
  window.CONTRACT_CONFIG = CONTRACT_CONFIG;
  window.CONTRACT_HELPERS = HELPERS;
}

// Log configuration (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('📋 NetDAG Contract Configuration Loaded');
  console.log('🌐 Network:', CONTRACT_CONFIG.NETWORK);
  console.log('🪙 NDG Token:', CONTRACT_CONFIG.NDG_TOKEN);
  console.log('🛒 Presale:', CONTRACT_CONFIG.PRESALE_CONTRACT);
  console.log('🏦 Vault:', CONTRACT_CONFIG.VESTING_VAULT);
}