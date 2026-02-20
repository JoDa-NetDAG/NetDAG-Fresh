require("@nomiclabs/hardhat-waffle");
// require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.17",  // ← CHANGED FROM 0.8.20 TO MATCH YOUR CONTRACTS
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.TESTNET_PRIVATE_KEY ? [process.env.TESTNET_PRIVATE_KEY] : [],
    },
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  // etherscan: {
  //   apiKey: process.env.BSCSCAN_API_KEY,
  // },
};