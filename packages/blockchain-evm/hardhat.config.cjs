require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load environment variables

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
    solidity: {
        version: "0.8.20",
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
            chainId: 1, // Hardhat default
            forking: {
                url: process.env.ALCHEMY_MAINNET_URL || "https://eth-mainnet.g.alchemy.com/v2/0nZHf3YNJnRwvE_QmKVeN",
                blockNumber: 19200000, // Pin to specific block for caching
                enabled: process.env.FORK_MAINNET === "true"
            }
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 1
        }
    }
};
module.exports = config;
