import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MintBadgesTaskArgs } from "../../tasks/mintBadges";

async function batchMintBadges() {
  const diamondAddress = "0xBf757a8A1Cf10F2c6D9f591eDF00E6ce4F22D249";
  const diamondOwner = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  const hre: HardhatRuntimeEnvironment = require("hardhat");

  const addresses = [
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
  ];

  // Define the task arguments
  const taskArgs: MintBadgesTaskArgs = {
    badgeIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].toString(), // Replace with actual badge IDs
    addresses: addresses.toString(), // Replace with actual addresses
    diamondOwner: diamondOwner,
    diamondAddress: diamondAddress,
  };

  // Run the mintBadges task
  await hre.run("mintBadges", taskArgs);

  console.log("Batch minting of badges completed successfully.");
}

// Execute the function if this script is run directly
if (require.main === module) {
  batchMintBadges()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { batchMintBadges };
