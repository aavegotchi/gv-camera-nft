/* global ethers */
/* eslint prefer-const: "off" */

import { ethers } from "hardhat";
import { deployAGCDiamond } from "./deployAGCDiamond";
import { deployGPDiamond } from "./deployGPDiamond";

export async function deployDiamonds() {
  const network = await ethers.provider.getNetwork();

  console.log("chain:", network.chainId);

  console.log("Deploying AGCDiamond");
  const agcDiamondAddress = await deployAGCDiamond();
  console.log("Deploying GPDiamond");
  const gpdiamondAddress = await deployGPDiamond(agcDiamondAddress);

  console.log("AGCDiamond deployed: ", agcDiamondAddress);
  console.log("GPDiamond deployed: ", gpdiamondAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamonds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployGPDiamond = deployDiamonds;
