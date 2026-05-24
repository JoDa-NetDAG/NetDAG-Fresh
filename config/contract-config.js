// ============================================================
// NetDAG Presale - Contract Configuration
// BSC Testnet Deployment
// Simple Presale: BNB -> NDG immediately
// ============================================================
//
// Source of truth:
// - Project-docs/NetDAG Presale Decision Log.txt
// - Project-docs/NetDAG Deployed Contracts Registry.md
// - Project-docs/NetDAG Wallets and Token Allocation Registry.txt
//
// Last updated: 24 May 2026
// ============================================================

const CONTRACT_CONFIG = {
  // ==========================================================
  // Network Settings
  // ==========================================================
  NETWORK: "bscTestnet",
  CHAIN_ID: 97,
  CHAIN_ID_HEX: "0x61",
  RPC_URL: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  BLOCK_EXPLORER: "https://testnet.bscscan.com",

  // ==========================================================
  // Current Active Contract Addresses
  // ==========================================================
  CONTRACT_ADDRESSES: {
    // Current active NDG token used in the successful simple BNB presale test
    NDG_TOKEN_ADDRESS: "0xc0E6b1b7a11DB4d126D009f0F4C19F430bd413d7",

    // Current active simple BNB immediate presale contract
    PRESALE_ADDRESS: "0xAc9E6f29C78E4a3cDdd3bDDC3d58a8A46224B160",

    // Mock BNB/USD price feed used for BSC Testnet testing
    BNB_PRICE_FEED: "0x0111407fC731c09daF493B8Ae4442C9C52b830Ba",

    // Current testing / treasury reference used in the successful frontend test
    TREASURY_ADDRESS: "0x4ecF4EfD28b976Dcae835a0a7611595cAd4cC5CD",

    // Known working / existing testnet contracts kept for now
    STAKING_ADDRESS: "0x7730dCD24b93F171A7B7B85FcDB4193E94614D70",
    PROVENANCE_ADDRESS: "0x5edd83151c03fad61004214cb895832cde322b67"
  },

  // ==========================================================
  // Presale Settings
  // ==========================================================
  PRESALE_SETTINGS: {
    // Locked Tier 1 / Initial Access Stage price
    // $0.006 per NDG
    TOKEN_PRICE_USD: "0.006",

    // Minimum buy confirmed by active presale contract
    MIN_BUY_USD: 50,

    // Total Presale & Referral allocation
    TOTAL_PRESALE_ALLOCATION: "600000000",

    // Direct tier allocation from tokenomics rows
    DIRECT_TIER_ALLOCATION: "558000000",

    // Referral / bonus / buffer reserve
    REFERRAL_BONUS_RESERVE: "42000000",

    // Current testnet sale status
    SALE_ACTIVE: true
  },

  // ==========================================================
  // Tier Pricing Reference
  // ==========================================================
  // Note:
  // The current deployed NDGPresaleBNB contract is a simple single-price
  // BNB presale contract. It does not yet implement automatic tier advancement.
  //
  // These tiers are documentation/frontend reference only until a future
  // tier-aware contract is deployed.
  TIERS: [
    { tier: 1, price: "0.006", allocation: "108000000", note: "Initial Access Stage / 125x reference" },
    { tier: 2, price: "0.012", allocation: "84000000", note: "Future tier reference" },
    { tier: 3, price: "0.018", allocation: "72000000", note: "Future tier reference" },
    { tier: 4, price: "0.024", allocation: "66000000", note: "Future tier reference" },
    { tier: 5, price: "0.030", allocation: "60000000", note: "Future tier reference" },
    { tier: 6, price: "0.054", allocation: "54000000", note: "Future tier reference" },
    { tier: 7, price: "0.084", allocation: "48000000", note: "Future tier reference" },
    { tier: 8, price: "0.120", allocation: "36000000", note: "Future tier reference" },
    { tier: 9, price: "0.160", allocation: "30000000", note: "Future tier reference" }
  ],

  // ==========================================================
  // Token Information
  // ==========================================================
  TOKEN_INFO: {
    NAME: "NetDAG",
    SYMBOL: "NDG",
    DECIMALS: 18,
    TOTAL_SUPPLY: "1000000000",
    PRESALE_ALLOCATION: "600000000",
    PROTOCOL_RESERVE_PERCENT: 22,
    PROTOCOL_RESERVE_AMOUNT: "220000000"
  },

  // ==========================================================
  // Wallet Addresses
  // ==========================================================
  WALLETS: {
    DEPLOYER: "0x4ecF4EfD28b976Dcae835a0a7611595cAd4cC5CD",
    TREASURY: "0x4ecF4EfD28b976Dcae835a0a7611595cAd4cC5CD",
    TEST_WALLET: "0x4ecF4EfD28b976Dcae835a0a7611595cAd4cC5CD",

    // Older references kept only for clarity. Do not use as current source of truth.
    OLD_TREASURY_REFERENCE: "0x8834Aa98987c170C0F36E087a7fFa08070C1aD4B",
    OLD_DEPLOYER_REFERENCE: "0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318"
  },

  // ==========================================================
  // Simple Presale ABI
  // ==========================================================
  ABIS: {
    NDG_TOKEN: [
      "function balanceOf(address account) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)"
    ],

    PRESALE: [
      "function buyWithBNB() payable",
      "function previewBuy(uint256 bnbAmount) view returns (uint256 usdValue, uint256 ndgAmount)",
      "function getBNBValueUSD(uint256 bnbAmount) view returns (uint256)",
      "function remainingTokens() view returns (uint256)",
      "function totalSold() view returns (uint256)",
      "function totalRaisedUSD() view returns (uint256)",
      "function saleActive() view returns (bool)",
      "function tokenPriceUSD() view returns (uint256)",
      "function minBuyUSD() view returns (uint256)",
      "function presaleAllocation() view returns (uint256)",
      "function treasury() view returns (address)"
    ]
  },

  // ==========================================================
  // Feature Flags
  // ==========================================================
  FEATURES: {
    // Current working flow
    BNB_PAYMENT: true,
    IMMEDIATE_NDG_TRANSFER: true,
    METAMASK_FIRST: true,

    // Future / disabled features
    STABLECOIN_PAYMENT: false,
    USDT_PAYMENT: false,
    USDC_PAYMENT: false,
    BUSD_PAYMENT: false,
    WALLETCONNECT: false,
    TRUST_WALLET_QR: false,
    REFERRAL_SYSTEM: false,
    EARLY_ACCESS: false,
    CLIFF_REDUCTION: false,
    VESTING: false,
    AUTO_TIER_ADVANCE: false,
    BONDING_CURVE_ACTIVE_DURING_PRESALE: false
  },

  // ==========================================================
  // Display Settings
  // ==========================================================
  DISPLAY: {
    PRICE_DECIMALS: 3,
    TOKEN_DECIMALS: 2,
    USD_DECIMALS: 2,
    BNB_DECIMALS: 6
  },

  // ==========================================================
  // Frontend URLs
  // ==========================================================
  URLS: {
    WEBSITE: "https://netdag.com",
    TELEGRAM: "https://t.me/NetDAG",
    TWITTER: "https://x.com/NetDAGOfficial",
    DISCORD: "https://discord.gg/GycvtzBs",
    GITHUB: "https://github.com/JoDa-NetDAG",
    YOUTUBE: "https://www.youtube.com/@NetDAGOfficial",
    FACEBOOK: "https://www.facebook.com/share/1B14RrcR9g/",
    INSTAGRAM: "https://instagram.com/netdagofficial",
    MEDIUM: "https://medium.com/@NetDAGOfficial"
  },

  // ==========================================================
  // Current Successful Test Record
  // ==========================================================
  TEST_RECORDS: {
    FIRST_SUCCESSFUL_BNB_BUY: {
      DATE: "24 May 2026",
      BUYER: "0x4ecF4EfD28b976Dcae835a0a7611595cAd4cC5CD",
      USD_AMOUNT: "50",
      BNB_PAID: "0.076923076923076927",
      NDG_RECEIVED: "8333.333333333333758333",
      TX_HASH: "0x88c7202fc85627ff695a5bbb4950e86d2268d96d045621a51f02070a0309e305",
      RESULT: "Success"
    }
  }
};

// ============================================================
// Backward-Compatible Direct Shortcuts
// ============================================================

CONTRACT_CONFIG.NDG_TOKEN = CONTRACT_CONFIG.CONTRACT_ADDRESSES.NDG_TOKEN_ADDRESS;
CONTRACT_CONFIG.NDG_TOKEN_ADDRESS = CONTRACT_CONFIG.CONTRACT_ADDRESSES.NDG_TOKEN_ADDRESS;

CONTRACT_CONFIG.PRESALE_CONTRACT = CONTRACT_CONFIG.CONTRACT_ADDRESSES.PRESALE_ADDRESS;
CONTRACT_CONFIG.PRESALE_ADDRESS = CONTRACT_CONFIG.CONTRACT_ADDRESSES.PRESALE_ADDRESS;

CONTRACT_CONFIG.TREASURY_ADDRESS = CONTRACT_CONFIG.CONTRACT_ADDRESSES.TREASURY_ADDRESS;
CONTRACT_CONFIG.BNB_PRICE_FEED = CONTRACT_CONFIG.CONTRACT_ADDRESSES.BNB_PRICE_FEED;
CONTRACT_CONFIG.STAKING_ADDRESS = CONTRACT_CONFIG.CONTRACT_ADDRESSES.STAKING_ADDRESS;
CONTRACT_CONFIG.PROVENANCE_ADDRESS = CONTRACT_CONFIG.CONTRACT_ADDRESSES.PROVENANCE_ADDRESS;

// ============================================================
// Helper Functions
// ============================================================

const HELPERS = {
  getContractAddress(contractName) {
    const key = String(contractName || "").toUpperCase();

    const addresses = {
      NDG: CONTRACT_CONFIG.CONTRACT_ADDRESSES.NDG_TOKEN_ADDRESS,
      NDG_TOKEN: CONTRACT_CONFIG.CONTRACT_ADDRESSES.NDG_TOKEN_ADDRESS,
      TOKEN: CONTRACT_CONFIG.CONTRACT_ADDRESSES.NDG_TOKEN_ADDRESS,
      PRESALE: CONTRACT_CONFIG.CONTRACT_ADDRESSES.PRESALE_ADDRESS,
      PRESALE_CONTRACT: CONTRACT_CONFIG.CONTRACT_ADDRESSES.PRESALE_ADDRESS,
      TREASURY: CONTRACT_CONFIG.CONTRACT_ADDRESSES.TREASURY_ADDRESS,
      STAKING: CONTRACT_CONFIG.CONTRACT_ADDRESSES.STAKING_ADDRESS,
      PROVENANCE: CONTRACT_CONFIG.CONTRACT_ADDRESSES.PROVENANCE_ADDRESS,
      BNB_PRICE_FEED: CONTRACT_CONFIG.CONTRACT_ADDRESSES.BNB_PRICE_FEED
    };

    return addresses[key];
  },

  getExplorerUrl(address, type = "address") {
    return `${CONTRACT_CONFIG.BLOCK_EXPLORER}/${type}/${address}`;
  },

  getTxUrl(txHash) {
    return `${CONTRACT_CONFIG.BLOCK_EXPLORER}/tx/${txHash}`;
  },

  getAddressUrl(address) {
    return `${CONTRACT_CONFIG.BLOCK_EXPLORER}/address/${address}`;
  },

  getCurrentTokenPrice() {
    return parseFloat(CONTRACT_CONFIG.PRESALE_SETTINGS.TOKEN_PRICE_USD);
  },

  getMinimumBuyUSD() {
    return Number(CONTRACT_CONFIG.PRESALE_SETTINGS.MIN_BUY_USD);
  },

  calculateTokens(usdAmount, tokenPrice = CONTRACT_CONFIG.PRESALE_SETTINGS.TOKEN_PRICE_USD) {
    const usd = parseFloat(usdAmount || 0);
    const price = parseFloat(tokenPrice || CONTRACT_CONFIG.PRESALE_SETTINGS.TOKEN_PRICE_USD);

    if (!Number.isFinite(usd) || !Number.isFinite(price) || price <= 0) {
      return "0.00";
    }

    return (usd / price).toFixed(2);
  },

  calculateUsdFromTokens(tokenAmount, tokenPrice = CONTRACT_CONFIG.PRESALE_SETTINGS.TOKEN_PRICE_USD) {
    const tokens = parseFloat(tokenAmount || 0);
    const price = parseFloat(tokenPrice || CONTRACT_CONFIG.PRESALE_SETTINGS.TOKEN_PRICE_USD);

    if (!Number.isFinite(tokens) || !Number.isFinite(price) || price <= 0) {
      return "0.00";
    }

    return (tokens * price).toFixed(2);
  },

  formatTokenAmount(amount, decimals = CONTRACT_CONFIG.DISPLAY.TOKEN_DECIMALS) {
    return Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  },

  formatUSD(amount) {
    return `$${parseFloat(amount || 0).toFixed(CONTRACT_CONFIG.DISPLAY.USD_DECIMALS)}`;
  },

  formatPrice(amount) {
    return `$${parseFloat(amount || 0).toFixed(CONTRACT_CONFIG.DISPLAY.PRICE_DECIMALS)}`;
  },

  isBscTestnet(chainId) {
    const normalized = String(chainId || "").toLowerCase();
    return normalized === String(CONTRACT_CONFIG.CHAIN_ID).toLowerCase() ||
      normalized === String(CONTRACT_CONFIG.CHAIN_ID_HEX).toLowerCase();
  }
};

// ============================================================
// Export for Node.js
// ============================================================

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONTRACT_CONFIG, HELPERS };
}

// ============================================================
// Export for Browser
// ============================================================

if (typeof window !== "undefined") {
  window.CONTRACT_CONFIG = CONTRACT_CONFIG;
  window.CONTRACT_HELPERS = HELPERS;

  // Optional legacy global name support
  window.NDG_CONFIG = {
    ...(window.NDG_CONFIG || {}),
    NETWORK: CONTRACT_CONFIG.NETWORK,
    CHAIN_ID: CONTRACT_CONFIG.CHAIN_ID,
    CHAIN_ID_HEX: CONTRACT_CONFIG.CHAIN_ID_HEX,
    RPC_URL: CONTRACT_CONFIG.RPC_URL,
    EXPLORER: CONTRACT_CONFIG.BLOCK_EXPLORER,
    BLOCK_EXPLORER: CONTRACT_CONFIG.BLOCK_EXPLORER,

    NDG_TOKEN_ADDRESS: CONTRACT_CONFIG.CONTRACT_ADDRESSES.NDG_TOKEN_ADDRESS,
    PRESALE_ADDRESS: CONTRACT_CONFIG.CONTRACT_ADDRESSES.PRESALE_ADDRESS,
    PRESALE_CONTRACT: CONTRACT_CONFIG.CONTRACT_ADDRESSES.PRESALE_ADDRESS,
    TREASURY_ADDRESS: CONTRACT_CONFIG.CONTRACT_ADDRESSES.TREASURY_ADDRESS,
    BNB_PRICE_FEED: CONTRACT_CONFIG.CONTRACT_ADDRESSES.BNB_PRICE_FEED,
    STAKING_ADDRESS: CONTRACT_CONFIG.CONTRACT_ADDRESSES.STAKING_ADDRESS,
    PROVENANCE_ADDRESS: CONTRACT_CONFIG.CONTRACT_ADDRESSES.PROVENANCE_ADDRESS,

    TOKEN_PRICE_USD: CONTRACT_CONFIG.PRESALE_SETTINGS.TOKEN_PRICE_USD,
    MIN_BUY_USD: CONTRACT_CONFIG.PRESALE_SETTINGS.MIN_BUY_USD
  };
}

// ============================================================
// Development Log
// ============================================================

if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") {
  console.log("📋 NetDAG Contract Configuration Loaded");
  console.log("🌐 Network:", CONTRACT_CONFIG.NETWORK);
  console.log("🪙 NDG Token:", CONTRACT_CONFIG.CONTRACT_ADDRESSES.NDG_TOKEN_ADDRESS);
  console.log("🛒 Presale:", CONTRACT_CONFIG.CONTRACT_ADDRESSES.PRESALE_ADDRESS);
  console.log("💵 Token Price:", CONTRACT_CONFIG.PRESALE_SETTINGS.TOKEN_PRICE_USD);
}