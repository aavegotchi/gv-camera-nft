import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";

require("./tasks/deployUpgrade.ts");
require("./tasks/generateDiamondABI");

const config: HardhatUserConfig = {
  typechain: {
    outDir: "src/types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    dontOverrideCompile: false, // defaults to false
  },
  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
};

export default config;
