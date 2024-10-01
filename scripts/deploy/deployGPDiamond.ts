/* global ethers */
/* eslint prefer-const: "off" */

import { ethers } from "hardhat";
import {
  initialSeasonPoints,
  defaultWheelWeights,
  defaultWheelPoints,
  networkAddresses,
  initialTokenConversionRates,
} from "../../constants";
import { deployAGCDiamond } from "./deployAGCDiamond";

import { cutDiamond } from "../helperFunctions";

export async function deployGPDiamond(agcDiamond: string) {
  let fud: string = ""; // Fud
  let fomo: string = ""; // Fomo
  let alpha: string = ""; // Alpha
  let kek: string = ""; // Kek

  if (agcDiamond === "") {
    agcDiamond = await deployAGCDiamond();
  }

  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  const network = await ethers.provider.getNetwork();
  console.log("Current network: ", network.name);

  if (network.name === "hardhat" || network.name === "unknown") {
    //deploy alchemica on local testnet
    const Alchemica = await ethers.getContractFactory("Alchemica");
    fud = (await Alchemica.deploy("Fud", "FUD")).address;
    fomo = (await Alchemica.deploy("Fomo", "FOMO")).address;
    alpha = (await Alchemica.deploy("Alpha", "ALPHA")).address;
    kek = (await Alchemica.deploy("Kek", "KEK")).address;

    console.log("Fud deployed: ", fud);
    console.log("Fomo deployed: ", fomo);
    console.log("Alpha deployed: ", alpha);
    console.log("Kek deployed: ", kek);
  } else {
    fud = networkAddresses[network.name].FUD_ADDRESS;
    fomo = networkAddresses[network.name].FOMO_ADDRESS;
    alpha = networkAddresses[network.name].ALPHA_ADDRESS;
    kek = networkAddresses[network.name].KEK_ADDRESS;
  }

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("GPDiamond");
  const diamond = await Diamond.deploy(
    contractOwner.address,
    diamondCutFacet.address,
    agcDiamond,
    fud,
    fomo,
    alpha,
    kek,
    initialSeasonPoints, //1,000,000,000
    defaultWheelWeights,
    defaultWheelPoints,
    initialTokenConversionRates
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
    "GotchiPointsFacet",
    "WheelFacet",
  ];

  await cutDiamond(diamond.address, FacetNames, ethers, diamondInit);

  return diamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployGPDiamond("")
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployGPDiamond = deployGPDiamond;
