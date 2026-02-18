// Configuration for BNB Chain TESTNET (BSC Testnet)

export const CONTRACT_CONFIG = {
  // Contract Addresses
  TOKEN_CONTRACT: '0xf8E886791E26DFD9195C1225b4Ca6458725DAe50',
  PRESALE_CONTRACT: '0x74d469c0eEd89b0F17189c824C95622C680f803E',
  VESTING_VAULT: '0x0aC817497d482629879d9c44fF226C033c5f64D4',
  STAKING_CONTRACT: '0x7730dCD24b93F171A7B7B85FcDB4193E94614D70',

  // Network Config
  CHAIN_ID: 97,
  NETWORK_NAME: 'BNB Smart Chain Testnet',
  RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  EXPLORER_URL: 'https://testnet.bscscan.com',

  // Legacy settings (for backward compatibility)
  CURRENCY_SYMBOL: 'tBNB',
  CURRENCY_DECIMALS: 18,
  RPC_URL_BACKUP: [
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/',
    'https://data-seed-prebsc-2-s2.binance.org:8545/',
  ],
  EXPLORER_NAME: 'BscScan Testnet',
};

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'NetDAG',
  VERSION: '1.0.0',
  TOKEN_SYMBOL: 'NDG',
  TOKEN_DECIMALS: 18,
};

// Network configuration for wallet
export const NETWORK_CONFIG = {
  // Computed hex value for 97 (0x61)
  chainId: `0x${CONTRACT_CONFIG.CHAIN_ID.toString(16)}`,
  chainName: CONTRACT_CONFIG.NETWORK_NAME,
  nativeCurrency: {
    name: 'Test BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: [CONTRACT_CONFIG.RPC_URL],
  blockExplorerUrls: [CONTRACT_CONFIG.EXPLORER_URL],
};