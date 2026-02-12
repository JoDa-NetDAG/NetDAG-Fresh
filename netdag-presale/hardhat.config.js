require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const { BSC_TESTNET_RPC, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    bsctest: {
      url: BSC_TESTNET_RPC || "",
      chainId: 97,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};
