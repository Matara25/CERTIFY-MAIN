require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Ganache host
      port: 7545,        // Ganache port (7545 for Ganache GUI, 8545 for Ganache CLI)
      network_id: "*",   // Match any network ID
    },
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 11155111,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },
  compilers: {
    solc: {
      version: "0.8.0", // Specify your Solidity compiler version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  },
};