import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BadgeFacet } from "../src/types";
import { ethers } from "hardhat";

import * as fs from "fs";

export interface AddBadgesTaskArgs {
  badgesJson: string;
  diamondAddress: string;
  diamondOwner: string;
}

export type RarityType = "Bronze" | "Silver" | "Gold" | "Godlike";

//TO-DO
const rarityMap: { [key: string]: number } = {
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Godlike: 4,
};

export interface BadgeData {
  id: string;
  title: string;
  imageHash: string;
  description: string;
  type: string;
  category: string;
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
      const badgesJson: BadgeData[] = JSON.parse(
        fs.readFileSync(badgesJsonPath, "utf8")
      );

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
      console.log(`adding: ${badgesJson.length} badges`);

      for (const badge of badgesJson) {
        const {
          id,
          title,
          imageHash,
          description,
          type,
          category,
          subcategory,
          rarity,
          url,
        } = badge;
        // const badgeId = id;

        const gameId = 0; //TO-DO
        const gameTitle = ""; //TO-DO

        rarities.push(rarityMap[rarity]);
        badgeIds.push(id);
        gameIds.push(gameId);
        gameTitles.push(gameTitle);
        titles.push(title);
        descriptions.push(description);
        imageUrls.push(url);
      }

      const batchSize = 20;
      for (let i = 0; i < badgesJson.length; i += batchSize) {
        const batchRarities = rarities.slice(i, i + batchSize);
        const batchBadgeIds = badgeIds.slice(i, i + batchSize);
        const batchGameIds = gameIds.slice(i, i + batchSize);
        const batchGameTitles = gameTitles.slice(i, i + batchSize);
        const batchTitles = titles.slice(i, i + batchSize);
        const batchDescriptions = descriptions.slice(i, i + batchSize);
        const batchImageUrls = imageUrls.slice(i, i + batchSize);
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
      console.log("All badges added successfully!");
    }
  );
