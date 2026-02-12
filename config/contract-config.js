// Configuration for BNB Chain TESTNET (BSC Testnet)

export const CONTRACT_CONFIG = {
  // Your TESTNET contract addresses
  STAKING_CONTRACT: '0x7730dCD24b93F171A7B7B85FcDB4193E94614D70',
  TOKEN_CONTRACT: '0x35730a53211cB79186a07B84dc0e6a3412E31A57',

  // BNB Chain TESTNET settings
  CHAIN_ID: 97, // 97 = BSC TESTNET
  NETWORK_NAME: 'BNB Smart Chain Testnet',
  CURRENCY_SYMBOL: 'tBNB',
  CURRENCY_DECIMALS: 18,

  // RPC URLs for BSC TESTNET (no stray spaces)
  RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  RPC_URL_BACKUP: [
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/',
    'https://data-seed-prebsc-2-s2.binance.org:8545/',
  ],

  // Block explorer for TESTNET
  EXPLORER_URL: 'https://testnet.bscscan.com',
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