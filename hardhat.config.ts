/* global ethers task */
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "solidity-coverage";

require("./tasks/deployUpgrade.ts");
require("./tasks/generateDiamondABI");
require("./tasks/addBadges.ts");
require("./tasks/mintBadges.ts");

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    dontOverrideCompile: false, // defaults to false
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    // hardhat: {
    //   forking: {
    //     url: process.env.POLTER_URL,
    //     timeout: 12000000,
    //   },
    //   blockGasLimit: 20000000,
    //   timeout: 120000,
    //   gas: "auto",
    // },
    localhost: {
      timeout: 16000000,
    },
    matic: {
      url: process.env.MATIC_URL,
      // url: 'https://rpc-mainnet.maticvigil.com/',
      accounts: [process.env.ITEM_MANAGER],
      // blockGasLimit: 20000000,
      blockGasLimit: 20000000,
      gasPrice: 400000000000,
      timeout: 90000,
    },
    amoy: {
      url: process.env.AMOY_URL,
      accounts: [process.env.ITEM_MANAGER],
      gasPrice: 30000000000,
    },
    polter: {
      url: process.env.POLTER_URL,
      accounts: [process.env.POLTER_DEPLOYER],
      gasPrice: 30000000000,
    },

    // gorli: {
    //   url: process.env.GORLI,
    //   accounts: [process.env.SECRET],
    //   blockGasLimit: 20000000,
    //   gasPrice: 2100000000
    // },
    // kovan: {
    //   url: process.env.KOVAN_URL,
    //   accounts: [process.env.SECRET],
    //   gasPrice: 5000000000
    // },
    // ethereum: {
    //   url: process.env.MAINNET_URL,
    //   accounts: [process.env.SECRET],
    //   blockGasLimit: 20000000,
    //   gasPrice: 2100000000
    // }
  },
};
