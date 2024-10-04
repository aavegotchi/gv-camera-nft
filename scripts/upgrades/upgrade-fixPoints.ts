import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { itemManagerHw, networkAddresses } from "../../constants";

async function upgradeFixPoints() {
  const network = await ethers.provider.getNetwork();

  const diamondAddress = networkAddresses[network.chainId]["AGC_ADDRESS"];

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PointsFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "BadgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "GotchiPointsFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: itemManagerHw,
    diamondAddress: diamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  // Run the upgrade function

  upgradeFixPoints()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { upgradeFixPoints };
