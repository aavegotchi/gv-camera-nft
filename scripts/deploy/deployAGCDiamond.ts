/* global ethers */
/* eslint prefer-const: "off" */

import { ethers, network } from "hardhat";
import { cutDiamond } from "../helperFunctions";

export async function deployAGCDiamond() {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  const testAdmins = [
    contractOwner.address,
    "0xbCDe4ef0E8b16C1b691EF552FA4BBD98560b991b",
    "0xAd0CEb6Dc055477b8a737B630D6210EFa76a2265",
  ];

  const realAdmins = [contractOwner.address];

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("AGCDiamond");
  const diamond = await Diamond.deploy(
    contractOwner.address,
    diamondCutFacet.address,
    ["unknown", "hardhat", "amoy"].includes(network.name)
      ? testAdmins
      : realAdmins
  );
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  console.log("");
  console.log("Deploying facets");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "PointsFacet",
    "AdminFacet",
    "GamesFacet",
    "BadgeFacet",
  ];

  await cutDiamond(diamond.address, FacetNames, ethers, diamondInit);

  return diamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployAGCDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployAGCDiamond = deployAGCDiamond;
