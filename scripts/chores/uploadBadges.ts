import { run } from "hardhat";
import { AddBadgesTaskArgs } from "../../tasks/addBadges";
import { AGCDIAMOND_AMOY } from "../constants";

export async function uploadBadges(agcDiamondAddress: string, owner: string) {
  const args: AddBadgesTaskArgs = {
    badgesJson: "scripts/data/badges.ts",
    diamondAddress: agcDiamondAddress,
    diamondOwner: owner,
  };
  await run("addBadges", args);
}

if (require.main === module) {
  uploadBadges(AGCDIAMOND_AMOY, "0x8D46fd7160940d89dA026D59B2e819208E714E82")
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
