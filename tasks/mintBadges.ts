import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BadgeFacet } from "../src/types";

export interface MintBadgesTaskArgs {
  badgeIds: string;
  addresses: string;
  diamondOwner: string;
  diamondAddress: string;
}

task("mintBadges", "Add new badges to the AGC Diamond")
  .addParam("badgeIds", "Comma separated list of badge ids")
  .addParam("addresses", "Comma separated list of addresses")
  .addParam("diamondOwner", "Address of the contract owner")
  .addParam("diamondAddress", "Address of the AGCDiamond")
  .setAction(
    async (taskArgs: MintBadgesTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const badgeIds = taskArgs.badgeIds.split(",");
      const addresses = taskArgs.addresses.split(",");

      console.log("badgeIds", badgeIds);
      console.log("addresses", addresses);

      let signer: Signer;
      const owner = taskArgs.diamondOwner;
      const testing = ["hardhat", "localhost"].includes(hre.network.name);

      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [owner],
        });

        await hre.network.provider.request({
          method: "hardhat_setBalance",
          params: [owner, "0x100000000000000000000000"],
        });

        signer = await hre.ethers.getSigner(owner);
      } else if (hre.network.name === "matic" || hre.network.name === "amoy") {
        signer = (await hre.ethers.getSigners())[0];
      } else {
        throw Error("Incorrect network selected");
      }

      const badgeFacet = (await hre.ethers.getContractAt(
        "BadgeFacet",
        taskArgs.diamondAddress,
        signer
      )) as BadgeFacet;

      const batchSize = 50;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batchAddresses = addresses.slice(i, i + batchSize);
        const batchBadgeIds = badgeIds.slice(i, i + batchSize);

        console.log(`Minting badges ${i} to ${i + batchSize - 1}`);
        const tx = await badgeFacet.batchMintBadges(
          batchAddresses,
          batchBadgeIds
        );
        console.log("tx", tx.hash);
        await tx.wait();
      }

      console.log("All badges added successfully!");
    }
  );
