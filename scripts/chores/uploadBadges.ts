import { run } from "hardhat";
import { AddBadgesTaskArgs } from "../../tasks/addBadges";
import { AGCDIAMOND_AMOY } from "../constants";

async function main() {
  const args: AddBadgesTaskArgs = {
    badgesJson: "scripts/badges.json",
    diamondAddress: AGCDIAMOND_AMOY,
    diamondOwner: "0x8D46fd7160940d89dA026D59B2e819208E714E82",
  };
  await run("addBadges", args);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
