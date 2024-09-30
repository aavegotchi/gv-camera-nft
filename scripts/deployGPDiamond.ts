/* global ethers */
/* eslint prefer-const: "off" */

import { ethers } from "hardhat";
import { FacetCutAction, getSelectors } from "./libraries/diamond";
import { maticAddresses } from "../constants";
import { deployAGCDiamond } from "./deployAGCDiamond";

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
  } else if (network.name === "matic") {
    fud = maticAddresses.FUD_ADDRESS;
    fomo = maticAddresses.FOMO_ADDRESS;
    alpha = maticAddresses.ALPHA_ADDRESS;
    kek = maticAddresses.KEK_ADDRESS;
  }
  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  const initialSeasonPoints = ethers.utils.parseEther("1000000000");

  const defaultWheelWeights = [50, 200, 500, 1500, 5000, 50000, 0];
  const defaultWheelPoints = [50, 200, 500, 1500, 5000, 50000, 0];

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
    initialSeasonPoints,
    defaultWheelWeights,
    defaultWheelPoints
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
    // "VRFFacet",
    "WheelFacet",
  ];
  const cut = [];

  const uniqueSelectors = new Set();

  for (const FacetName of FacetNames) {
    const localSelectors = new Set();

    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy();
    await facet.deployed();
    console.log(`${FacetName} deployed: ${facet.address}`);

    const selectors = getSelectors(facet);
    for (const selector of selectors) {
      if (uniqueSelectors.has(selector)) {
        const functionName = facet.interface.getFunction(selector).name;

        console.warn(
          `Selector ${selector} (${functionName}) already in diamond`
        );
      } else {
        uniqueSelectors.add(selector);
        localSelectors.add(selector);
      }
    }

    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: Array.from(localSelectors),
    });
  }

  // upgrade diamond with facets
  console.log("");
  console.log("Diamond Cut:", cut);
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);
  let tx;
  let receipt;
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData("init");
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
  console.log("Diamond cut tx: ", tx.hash);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("Completed diamond cut");
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
