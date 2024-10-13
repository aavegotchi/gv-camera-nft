import { Contract } from "@ethersproject/contracts";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import {
  DiamondInit,
  DiamondLoupeFacet,
  IDiamondCut,
  OwnershipFacet,
} from "../src/types";
import { FacetCutAction } from "./libraries/diamond";
import { BytesLike } from "ethers";

export const gasPrice = 570000000000;

export function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function impersonate(
  address: string,
  contract: any,
  ethers: any,
  network: any
) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });

  //give some ether
  await ethers.provider.send("hardhat_setBalance", [
    address,
    "0x100000000000000000000",
  ]);

  let signer = await ethers.getSigner(address);
  contract = contract.connect(signer);
  return contract;
}

export async function resetChain(hre: any) {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.MATIC_URL,
        },
      },
    ],
  });
}

export function getSighashes(selectors: string[], ethers: any): string[] {
  if (selectors.length === 0) return [];
  const sighashes: string[] = [];
  selectors.forEach((selector) => {
    if (selector !== "") sighashes.push(getSelector(selector, ethers));
  });
  return sighashes;
}

export function getSelectors(contract: Contract) {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = signatures.reduce((acc: string[], val: string) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  return selectors;
}

export function getSelector(func: string, ethers: any) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

export const maticDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

export const maticDiamondUpgrader =
  "0x01F010a5e001fe9d6940758EA5e8c777885E351e";

export const itemManager = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";

export const itemManagerAlt = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

export const gameManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

export const maticRealmDiamondAddress =
  "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";

export const maticInstallationDiamondAddress =
  "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";
export const maticTileDiamondAddress =
  "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";

export const maticFakeGotchiCards =
  "0x9f6BcC63e86D44c46e85564E9383E650dc0b56D7";

export const maticFakeGotchiArt = "0xA4E3513c98b30d4D7cc578d2C328Bd550725D1D0";

export const maticForgeDiamond = "0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442";

export const mumbaiOwner = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
export const mumbiaAavegotchiDiamond =
  "0x83e73D9CF22dFc3A767EA1cE0611F7f50306622e";
export const mumbaiWearableDiamond =
  "0x1b1bcB49A744a09aEd636CDD9893508BdF1431A8";
export const mumbaiForgeDiamond = "0x2E6cb85DD86141a2A284988E883fF377CA223afE";

export async function diamondOwner(address: string, ethers: any) {
  return await (await ethers.getContractAt("OwnershipFacet", address)).owner();
}

export async function getFunctionsForFacet(facetAddress: string, ethers: any) {
  const Loupe = (await ethers.getContractAt(
    "DiamondLoupeFacet",
    maticDiamondAddress
  )) as DiamondLoupeFacet;
  const functions = await Loupe.facetFunctionSelectors(facetAddress);
  return functions;
}

export async function getDiamondSigner(
  hre: HardhatRuntimeEnvironment,
  override?: string,
  useLedger?: boolean
) {
  //Instantiate the Signer
  const owner = await (
    (await hre.ethers.getContractAt(
      "OwnershipFacet",
      maticDiamondAddress
    )) as OwnershipFacet
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [override ? override : owner],
    });
    return await hre.ethers.getSigner(override ? override : owner);
  } else if (hre.network.name === "matic") {
    console.log("Diamond signer - Matic");

    return (await hre.ethers.getSigners())[0];
  } else if (hre.network.name === "tenderly") {
    return (await hre.ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }
}

export interface RelayerInfo {
  apiKey: string;
  apiSecret: string;
}

export async function getRelayerSigner(
  address: string,
  hre: HardhatRuntimeEnvironment
) {
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    console.log("Using Hardhat");
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });
    await hre.network.provider.request({
      method: "hardhat_setBalance",
      params: [address, "0x100000000000000000000000"],
    });
    return await hre.ethers.provider.getSigner(address);
  } else if (hre.network.name === "matic") {
    console.log("USING MATIC");

    const credentials: RelayerInfo = {
      apiKey: process.env.DEFENDER_APIKEY!,
      apiSecret: process.env.DEFENDER_SECRET!,
    };

    const provider = new DefenderRelayProvider(credentials);
    return new DefenderRelaySigner(credentials, provider, {
      speed: "safeLow",
      validForSeconds: 7200,
    });
  } else if (hre.network.name === "tenderly") {
    //impersonate
    console.log("Using tenderly");
    return (await hre.ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }
}

export async function cutDiamond(
  diamondAddress: string,
  FacetNames: string[],
  ethers: any,
  diamondInit: any,
  showDiamondCut: boolean = false
) {
  const cut: IDiamondCut.FacetCutStruct[] = [];

  const uniqueSelectors = new Set();

  for (const FacetName of FacetNames) {
    const localSelectors = new Set();

    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy();
    await facet.waitForDeployment();
    console.log(`${FacetName} deployed: ${facet.address}`);

    const selectors = getSelectors(facet);
    for (const selector of selectors) {
      if (uniqueSelectors.has(selector)) {
        const functionName = facet.interface.getFunction(selector).name;

        console.warn(
          `Selector ${selector} (${functionName}) already in diamond, omitting.`
        );
      } else {
        uniqueSelectors.add(selector);
        localSelectors.add(selector);
      }
    }

    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: Array.from(localSelectors) as BytesLike[],
    });
  }

  // upgrade diamond with facets
  console.log("");
  console.log("Diamond Cut:", cut);
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamondAddress);
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
}
