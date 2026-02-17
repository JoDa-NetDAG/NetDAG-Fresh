// Configuration for BNB Chain TESTNET (BSC Testnet)

export const CONTRACT_CONFIG = {
  // ============================================
  // DEPLOYED CONTRACT ADDRESSES
  // ============================================
  
  // Main token contract
  TOKEN_CONTRACT: '0xf8E886791E26DFD9195C1225b4Ca6458725DAe50',
  
  // Presale contract (with vesting & referrals)
  PRESALE_CONTRACT: '0x74d469c0eEd89b0F17189c824C95622C680f803E',
  
  // Vesting vault contract
  VESTING_VAULT: '0x0aC817497d482629879d9c44fF226C033c5f64D4',
  
  // Staking contract
  STAKING_CONTRACT: '0x7730dCD24b93F171A7B7B85FcDB4193E94614D70',

  // ============================================
  // NETWORK CONFIGURATION
  // ============================================
  
  CHAIN_ID: 97, // 97 = BSC TESTNET
  NETWORK_NAME: 'BNB Smart Chain Testnet',
  CURRENCY_SYMBOL: 'tBNB',
  CURRENCY_DECIMALS: 18,

  // ============================================
  // RPC ENDPOINTS
  // ============================================
  
  RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  RPC_URL_BACKUP: [
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/',
    'https://data-seed-prebsc-2-s2.binance.org:8545/',
  ],

  // ============================================
  // BLOCK EXPLORER
  // ============================================
  
  EXPLORER_URL: 'https://testnet.bscscan.com',
  EXPLORER_NAME: 'BscScan Testnet',
};

// ============================================
// APP CONFIGURATION
// ============================================

export const APP_CONFIG = {
  APP_NAME: 'NetDAG',
  VERSION: '1.0.0',
  TOKEN_SYMBOL: 'NDG',
  TOKEN_DECIMALS: 18,
  
  // Tokenomics
  TOTAL_SUPPLY: '1000000000', // 1 Billion
  PRESALE_ALLOCATION: '600000000', // 600M
  STAKING_REWARDS_POOL: '60000000', // 60M
};

// ============================================
// NETWORK CONFIG FOR WALLET
// ============================================

export const NETWORK_CONFIG = {
  chainId: `0x${CONTRACT_CONFIG.CHAIN_ID.toString(16)}`, // 0x61
  chainName: CONTRACT_CONFIG.NETWORK_NAME,
  nativeCurrency: {
    name: 'Test BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: [CONTRACT_CONFIG.RPC_URL],
  blockExplorerUrls: [CONTRACT_CONFIG.EXPLORER_URL],
};

// ============================================
// DEPLOYED ADDRESSES (READ FROM JSON)
// ============================================

// Optional: Load from deployed-addresses.json
// import deployedAddresses from './deployed-addresses.json';
// export const DEPLOYED_CONTRACTS = deployedAddresses.contracts;