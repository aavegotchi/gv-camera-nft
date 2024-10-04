import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BadgeFacet } from "../src/types";

export interface AddBadgesTaskArgs {
  badgesJson: string;
  diamondAddress: string;
  diamondOwner: string;
}

export type RarityType = "Bronze" | "Silver" | "Gold" | "Godlike";
export type BadgeType = "Loyalty" | "SFA" | "GG" | "Special";
export type BadgeCategory =
  | "Duel Launch"
  | "Community"
  | "Towers"
  | "Nests"
  | "Eggs"
  | "Gameplay"
  | "Items"
  | "Money"
  | "Kills"
  | "Activity"
  | "Creation"
  | "Hits"
  | "Shield"
  | "Consumables"
  | "Special Weapons"
  | "Logins"
  | "Service"
  | "Duels"
  | "Other";

//TO-DO
const rarityMap: { [key: string]: number } = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Godlike: 3,
};

export interface BadgeData {
  id: string;
  title: string;
  imageHash: string;
  description: string;
  type: BadgeType;
  category: BadgeCategory;
  subcategory: string;
  rarity: RarityType;
  url: string;
}

task("addBadges", "Add new badges to the AGC Diamond")
  .addParam("badgesJson", "Path to the JSON file containing badge data")
  .addParam("diamondAddress", "Address of the AGCDiamond")
  .addParam("diamondOwner", "Address of the contract owner")
  .setAction(
    async (taskArgs: AddBadgesTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const badgesJsonPath = taskArgs.badgesJson;
      const badges: BadgeData[] = require(`../${badgesJsonPath}`).badges;

      console.log("badgesJson", badges);

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

      const rarities: number[] = [];
      const badgeIds: string[] = [];
      const gameIds: number[] = [];
      const gameTitles: string[] = [];
      const titles: string[] = [];
      const descriptions: string[] = [];
      const imageUrls: string[] = [];
      console.log(`adding: ${badges.length} badges`);

      for (const badge of badges) {
        const {
          id,
          title,
          imageHash,
          description,
          type,
          rarity,
          // url,
        } = badge;
        // const badgeId = id;

        const gameId = 0; //TO-DO
        const rarityInt = rarityMap[rarity];
        const gameTitle = type;
        rarities.push(rarityInt);
        badgeIds.push(id);
        gameIds.push(gameId);
        gameTitles.push(gameTitle);
        titles.push(title);
        descriptions.push(description);
        imageUrls.push(imageHash);
      }

      const batchSize = 50;
      for (let i = 0; i < badges.length; i += batchSize) {
        const batchRarities = rarities.slice(i, i + batchSize);

        const batchBadgeIds = badgeIds.slice(i, i + batchSize);
        const batchGameIds = gameIds.slice(i, i + batchSize);
        const batchGameTitles = gameTitles.slice(i, i + batchSize);
        const batchTitles = titles.slice(i, i + batchSize);
        const batchDescriptions = descriptions.slice(i, i + batchSize);
        const batchImageUrls = imageUrls.slice(i, i + batchSize);

        console.log(
          batchRarities.length,
          batchGameIds.length,
          batchGameTitles.length,
          batchTitles.length,
          batchDescriptions.length,
          batchImageUrls.length,
          batchBadgeIds.length
        );

        console.log(`Adding badges ${i} to ${i + batchSize}`);
        const tx = await badgeFacet.batchAddBadges(
          batchRarities,
          batchBadgeIds,
          batchGameIds,
          batchGameTitles,
          batchTitles,
          batchDescriptions,
          batchImageUrls
        );
        await tx.wait();
      }

      //get length
      const length = await badgeFacet.getBadgesLength();
      console.log("length", length);

      // const addedBadges = await badgeFacet.getBadges([]);
      // console.log("added badges", addedBadges, addedBadges.length);

      console.log("All badges added successfully!");
    }
  );
