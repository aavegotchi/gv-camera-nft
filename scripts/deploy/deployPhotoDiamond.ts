/* global ethers */
/* eslint prefer-const: "off" */

import { ethers } from "hardhat";
import { cutDiamond } from "../helperFunctions";

export async function deployPhotoDiamond() {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];
  const minter = accounts[1];

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("PhotoDiamond");
  const diamond = await Diamond.deploy(
    contractOwner.address,
    diamondCutFacet.address,
    300, // royalty percentage is out of 10000, so 3%
    [minter.address]
  );
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const DiamondInit = await ethers.getContractFactory("PhotoDiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  console.log("");
  console.log("Deploying facets");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "PhotoFacet",
    "PhotoAdminFacet",
  ];

  await cutDiamond(diamond.address, FacetNames, ethers, diamondInit);

  return diamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployPhotoDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployPhotoDiamond = deployPhotoDiamond;
