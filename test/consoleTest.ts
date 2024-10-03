import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";
//@ts-ignore
import { describe, it, before } from "mocha";
import { deployAGCDiamond } from "../scripts/deploy/deployDiamond";
import { getSelectors } from "../scripts/libraries/diamond";
import { expect } from "chai";
import {
  AdminFacet,
  BadgeFacet,
  DiamondCutFacet,
  DiamondLoupeFacet,
  GamesFacet,
  OwnershipFacet,
  PointsFacet,
} from "../src/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const { assert } = require("chai");

let diamondAddress: string;
let diamondCutFacet: DiamondCutFacet;
let diamondLoupeFacet: DiamondLoupeFacet;
let ownershipFacet: OwnershipFacet;
let result;
const addresses: string[] = [];

describe("DiamondTest", async function () {
  before(async function () {
    //Deploy both diamonds
    diamondAddress = await deployAGCDiamond();

    diamondCutFacet = await ethers.getContractAt(
      "DiamondCutFacet",
      diamondAddress
    );
    diamondLoupeFacet = await ethers.getContractAt(
      "DiamondLoupeFacet",
      diamondAddress
    );
    ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    );
  });

  it("should have nine facets -- call to facetAddresses function", async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 9);
  });

  it("facets should have the right function selectors -- call to facetFunctionSelectors function", async () => {
    let selectors = getSelectors(diamondCutFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers(result, selectors);
    selectors = getSelectors(diamondLoupeFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(result, selectors);
    selectors = getSelectors(ownershipFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(result, selectors);
  });

  it("selectors should be associated to facets correctly -- multiple calls to facetAddress function", async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress("0x1f931c1c")
    );
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress("0xcdffacc6")
    );
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress("0x01ffc9a7")
    );
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress("0xf2fde38b")
    );
  });

  it("should return the correct facet for a function selector", async () => {
    const selector = "0x1f931c1c"; // DiamondCut function selector
    const facetAddress = await diamondLoupeFacet.facetAddress(selector);
    expect(facetAddress).to.equal(addresses[0]);
  });

  it("should return the correct facets for the diamond", async () => {
    const facets = await diamondLoupeFacet.facets();
    expect(facets.length).to.equal(9);
    // You can add more specific checks for each facet if needed
  });
});

let adminFacet: AdminFacet;
let gamesFacet: GamesFacet;
let pointsFacet: PointsFacet;
let owner: SignerWithAddress;
let nonOwner: SignerWithAddress;
let admin1: SignerWithAddress;
let admin2: SignerWithAddress;

describe("AdminFacet", async function () {
  before(async () => {
    [owner, nonOwner, admin1, admin2] = await ethers.getSigners();

    //set gp address in agcdiamond
    adminFacet = (await ethers.getContractAt(
      "AdminFacet",
      diamondAddress
    )) as AdminFacet;
  });

  it("should allow the contract owner to set an admin", async () => {
    await expect(adminFacet.connect(owner).setAGCAdmin(admin1.address, true))
      .to.emit(adminFacet, "AGCAdminStatusChanged")
      .withArgs(admin1.address, true);

    const isAdmin = await adminFacet.isAGCAdmin(admin1.address);
    assert.isTrue(isAdmin, "Admin1 should be set as an admin");
  });

  it("should allow the contract owner to unset an admin", async () => {
    await expect(adminFacet.connect(owner).setAGCAdmin(admin1.address, false))
      .to.emit(adminFacet, "AGCAdminStatusChanged")
      .withArgs(admin1.address, false);

    const isAdmin = await adminFacet.isAGCAdmin(admin1.address);
    assert.isFalse(isAdmin, "Admin1 should be unset as an admin");
  });

  it("should allow the contract owner to set multiple admins in batch", async () => {
    await expect(
      adminFacet
        .connect(owner)
        .setAGCAdminsBatch([admin1.address, admin2.address], [true, true])
    )
      .to.emit(adminFacet, "AGCAdminStatusChanged")
      .withArgs(admin1.address, true)
      .and.to.emit(adminFacet, "AGCAdminStatusChanged")
      .withArgs(admin2.address, true);

    const isAdmin1 = await adminFacet.isAGCAdmin(admin1.address);
    const isAdmin2 = await adminFacet.isAGCAdmin(admin2.address);
    assert.isTrue(isAdmin1, "Admin1 should be set as an admin");
    assert.isTrue(isAdmin2, "Admin2 should be set as an admin");
  });

  it("should not allow non-owner to set an admin", async () => {
    await expect(
      adminFacet.connect(nonOwner).setAGCAdmin(admin1.address, true)
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });

  it("should not allow non-owner to set admins in batch", async () => {
    await expect(
      adminFacet
        .connect(nonOwner)
        .setAGCAdminsBatch([admin1.address, admin2.address], [false, false])
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });

  it("should allow setting and unsetting multiple admins in one batch call", async () => {
    await adminFacet
      .connect(owner)
      .setAGCAdminsBatch([admin1.address, admin2.address], [true, false]);

    const isAdmin1 = await adminFacet.isAGCAdmin(admin1.address);
    const isAdmin2 = await adminFacet.isAGCAdmin(admin2.address);

    expect(isAdmin1).to.be.true;
    expect(isAdmin2).to.be.false;
  });

  it("should revert when trying to set admin status with mismatched array lengths", async () => {
    await expect(
      adminFacet
        .connect(owner)
        .setAGCAdminsBatch([admin1.address, admin2.address], [true])
    ).to.be.revertedWith("AdminFacet: Input arrays must have the same length");
  });
});

describe("PointsFacet", async function () {
  before(async () => {
    [owner, nonOwner, admin1, admin2] = await ethers.getSigners();
    pointsFacet = await ethers.getContractAt("PointsFacet", diamondAddress);
  });

  it("should allow admins to mint points", async () => {
    await pointsFacet.connect(admin1).mintPoints(nonOwner.address, 100);
    const points = await pointsFacet.getsPointsForAddresses([nonOwner.address]);
    assert.equal(points[0], 100, "Points should be minted correctly");
  });

  it("should not allow non-admins to mint points", async () => {
    await expect(
      pointsFacet.connect(nonOwner).mintPoints(nonOwner.address, 100)
    ).to.be.revertedWith("LibDiamond: Must be AGC admin or contract owner");
  });

  it("should not allow minting to zero address", async () => {
    await expect(
      pointsFacet.connect(admin1).mintPoints(ethers.constants.AddressZero, 100)
    ).to.be.revertedWith("PointsFacet: Cannot mint to zero address");
  });

  it("should not allow minting zero points", async () => {
    await expect(
      pointsFacet.connect(admin1).mintPoints(nonOwner.address, 0)
    ).to.be.revertedWith("PointsFacet: Amount must be greater than zero");
  });

  it("should correctly update points balance after multiple mints", async () => {
    await pointsFacet.connect(admin1).mintPoints(nonOwner.address, 100);
    await pointsFacet.connect(admin1).mintPoints(nonOwner.address, 150);

    const points = await pointsFacet.getsPointsForAddresses([nonOwner.address]);
    expect(points[0]).to.equal(350); // 100 from previous test + 100 + 150
  });

  it("should correctly return points for multiple addresses", async () => {
    await pointsFacet.connect(admin1).mintPoints(admin2.address, 200);

    const points = await pointsFacet.getsPointsForAddresses([
      nonOwner.address,
      admin2.address,
    ]);
    expect(points[0]).to.equal(350);
    expect(points[1]).to.equal(200);
  });
});

describe("GamesFacet", async function () {
  before(async () => {
    [owner, nonOwner, admin1, admin2] = await ethers.getSigners();
    gamesFacet = await ethers.getContractAt("GamesFacet", diamondAddress);
  });

  it("should allow owner to register a game", async () => {
    const gameTitle = "Test Game";
    const gameDescription = "A game for testing";
    const publisher = "Test Publisher";

    await expect(
      gamesFacet
        .connect(owner)
        .registerGame(gameTitle, gameDescription, publisher)
    )
      .to.emit(gamesFacet, "GameRegistered")
      .withArgs(0, gameTitle, publisher);

    const games = await gamesFacet.getGames([0]);
    assert.equal(games.length, 1, "One game should be registered");
    assert.equal(games[0].gameTitle, gameTitle, "Game title should match");
    assert.equal(
      games[0].gameDescription,
      gameDescription,
      "Game description should match"
    );
  });

  it("should not allow non-owner to register a game", async () => {
    await expect(
      gamesFacet
        .connect(nonOwner)
        .registerGame("Non-owner Game", "Description", "Publisher")
    ).to.be.revertedWith("LibDiamond: Must be AGC admin or contract owner");
  });

  it("should allow owner to update a game", async () => {
    const updatedTitle = "Updated Game";
    const updatedDescription = "An updated game description";
    const updatedPublisher = "Updated Publisher";

    await expect(
      gamesFacet
        .connect(owner)
        .updateGame(0, updatedTitle, updatedDescription, updatedPublisher)
    )
      .to.emit(gamesFacet, "GameUpdated")
      .withArgs(0, updatedTitle, updatedPublisher);

    const games = await gamesFacet.getGames([0]);
    assert.equal(
      games[0].gameTitle,
      updatedTitle,
      "Game title should be updated"
    );
    assert.equal(
      games[0].gameDescription,
      updatedDescription,
      "Game description should be updated"
    );
  });

  it("should not allow non-owner to update a game", async () => {
    await expect(
      gamesFacet
        .connect(nonOwner)
        .updateGame(0, "Non-owner Update", "Description", "Publisher")
    ).to.be.revertedWith("LibDiamond: Must be AGC admin or contract owner");
  });

  it("should return all games when no IDs are provided", async () => {
    await gamesFacet
      .connect(owner)
      .registerGame("Second Game", "Another test game", "Test Publisher");
    const allGames = await gamesFacet.getGames([]);
    assert.equal(allGames.length, 2, "Should return all registered games");
  });

  it("should return specific games when IDs are provided", async () => {
    const specificGames = await gamesFacet.getGames([1]);
    assert.equal(specificGames.length, 1, "Should return one specific game");
    assert.equal(
      specificGames[0].gameTitle,
      "Second Game",
      "Should return the correct game"
    );
  });

  it("should revert when requesting a non-existent game", async () => {
    await expect(gamesFacet.getGames([99])).to.be.revertedWith(
      "Game does not exist"
    );
  });

  it("getGame should return correct game data", async () => {
    const game = await gamesFacet.getGame(0);
    assert.equal(game.gameId, 0, "Game id should be correct");
    assert.equal(
      game.gameTitle,
      "Updated Game",
      "Game title should be correct"
    );
    assert.equal(
      game.gameDescription,
      "An updated game description",
      "Game description should be correct"
    );
    assert.isAbove(game.lastUpdated, 0, "Game last updated should be set");
  });

  it("getGame after multiple updates should return correct data", async () => {
    const initialTitle = "Initial Game";
    const initialDescription = "Initial game description";
    const initialPublisher = "Initial Publisher";

    await gamesFacet
      .connect(owner)
      .updateGame(0, initialTitle, initialDescription, initialPublisher);

    const game = await gamesFacet.getGame(0);
    assert.equal(game.gameTitle, initialTitle, "Game title should be updated");
    assert.equal(
      game.gameDescription,
      initialDescription,
      "Game description should be updated"
    );

    // Check that the lastUpdated timestamp has increased
    const currentTimestamp = Math.floor(Date.now() / 1000);
    assert.isAtLeast(
      game.lastUpdated.toNumber(),
      currentTimestamp - 60,
      "Last updated timestamp should be recent"
    );
  });

  it("should not allow registering a game with empty title", async () => {
    await expect(
      gamesFacet.connect(owner).registerGame("", "Description", "Publisher")
    ).to.be.revertedWith("Game title cannot be empty");
  });

  it("should not allow registering a game with empty description", async () => {
    await expect(
      gamesFacet.connect(owner).registerGame("Title", "", "Publisher")
    ).to.be.revertedWith("Game description cannot be empty");
  });

  it("should not allow registering a game with empty publisher", async () => {
    await expect(
      gamesFacet.connect(owner).registerGame("Title", "Description", "")
    ).to.be.revertedWith("Publisher cannot be empty");
  });

  it("should emit GameUpdated event with correct parameters", async () => {
    const updatedTitle = "Another Update";
    const updatedDescription = "Another updated description";
    const updatedPublisher = "Another Updated Publisher";

    await expect(
      gamesFacet
        .connect(owner)
        .updateGame(0, updatedTitle, updatedDescription, updatedPublisher)
    )
      .to.emit(gamesFacet, "GameUpdated")
      .withArgs(0, updatedTitle, updatedPublisher);
  });
});

describe("BadgeFacet", async function () {
  let badgeFacet: BadgeFacet;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  before(async function () {
    const addresses = await ethers.getSigners();

    //@ts-ignore
    owner = addresses[0];

    //@ts-ignore
    user = addresses[1];
    badgeFacet = await ethers.getContractAt("BadgeFacet", diamondAddress);
  });

  describe("adding and updating badges", async function () {
    it("should add a badge", async function () {
      const rarity = 1;
      const badgeId = "ABC123";
      const gameId = 0;
      const gameTitle = "Test Game";
      const title = "Test Badge";
      const description = "Test Description";
      const imageUrl = "arweave/123";

      await expect(
        badgeFacet
          .connect(owner)
          .addBadge(
            rarity,
            badgeId,
            gameId,
            gameTitle,
            title,
            description,
            imageUrl
          )
      )
        .to.emit(badgeFacet, "BadgeAdded")
        .withArgs(
          0,
          badgeId,
          rarity,
          gameId,
          gameTitle,
          title,
          description,
          imageUrl
        );

      const badges = await badgeFacet.getBadges([0]);
      expect(badges[0].rarity).to.equal(rarity);
      expect(badges[0].gameId).to.equal(gameId);
      expect(badges[0].title).to.equal(title);
      expect(badges[0].description).to.equal(description);
    });

    it("should update a badge", async function () {
      const id = 0;
      const badgeId = "ABC123";
      const newRarity = 2;
      const newGameId = 1;
      const newGameTitle = "Updated Game";
      const newTitle = "Updated Badge";
      const newDescription = "Updated Description";
      const newImageUrl = "arweave/123";
      await expect(
        badgeFacet
          .connect(owner)
          .updateBadge(
            id,
            badgeId,
            newRarity,
            newGameId,
            newGameTitle,
            newTitle,
            newDescription,
            newImageUrl
          )
      )
        .to.emit(badgeFacet, "BadgeUpdated")
        .withArgs(
          id,
          badgeId,
          newRarity,
          newGameId,
          newGameTitle,
          newTitle,
          newDescription,
          newImageUrl
        );

      const badges = await badgeFacet.getBadges([id]);
      expect(badges[0].rarity).to.equal(newRarity);
      expect(badges[0].gameId).to.equal(newGameId);
      expect(badges[0].title).to.equal(newTitle);
      expect(badges[0].description).to.equal(newDescription);
    });

    it("should batch add badges", async function () {
      const rarities = [1, 2, 3];
      const badgeIds = ["ABC123", "ABC456", "ABC789"];
      const gameIds = [0, 1, 2];
      const gameTitles = ["Game 1", "Game 2", "Game 3"];
      const titles = ["Badge 1", "Badge 2", "Badge 3"];
      const descriptions = ["Desc 1", "Desc 2", "Desc 3"];
      const imageUrls = ["arweave/123", "arweave/456", "arweave/789"];

      const tx = await badgeFacet
        .connect(owner)
        .batchAddBadges(
          rarities,
          badgeIds,
          gameIds,
          gameTitles,
          titles,
          descriptions,
          imageUrls
        );
      const receipt = await tx.wait();

      expect(
        receipt.events?.filter((e: any) => e.event === "BadgeAdded")
      ).to.have.length(3);

      const badges = await badgeFacet.getBadges([1, 2, 3]);
      expect(badges).to.have.length(3);
      for (let i = 0; i < 3; i++) {
        expect(badges[i].rarity).to.equal(rarities[i]);
        expect(badges[i].gameId).to.equal(gameIds[i]);
        expect(badges[i].title).to.equal(titles[i]);
        expect(badges[i].description).to.equal(descriptions[i]);
        expect(badges[i].imageUrl).to.equal(imageUrls[i]);
      }
    });
  });

  describe("minting badges", async function () {
    it("only agc admins can mint badges", async function () {
      await expect(
        badgeFacet.connect(user).mintBadge(await user.getAddress(), 0)
      ).to.be.revertedWith("LibDiamond: Must be AGC admin or contract owner");
    });

    it("should mint a badge and badge count should be 1", async function () {
      const badgeId = 0;
      await expect(
        badgeFacet.connect(admin1).mintBadge(await user.getAddress(), badgeId)
      )
        .to.emit(badgeFacet, "BadgeMinted")
        .withArgs(await user.getAddress(), badgeId);

      const balance = await badgeFacet.balanceOf(
        await user.getAddress(),
        badgeId
      );

      const badge = (await badgeFacet.getBadges([badgeId]))[0];

      expect(badge.count).to.equal(1);
      expect(balance).to.equal(1);
    });

    it("should not allow minting a badge twice", async function () {
      const badgeId = 0;
      await expect(
        badgeFacet.connect(admin1).mintBadge(await user.getAddress(), badgeId)
      ).to.be.revertedWith("User already owns this badge");
    });

    it("should batch mint badges", async function () {
      const users = [await user.getAddress(), await owner.getAddress()];
      const badgeIds = [1, 2];

      await badgeFacet.connect(admin1).batchMintBadges(users, badgeIds);

      for (let i = 0; i < users.length; i++) {
        const balance = await badgeFacet.balanceOf(users[i], badgeIds[i]);
        expect(balance).to.equal(1);
      }
    });
  });

  describe("transferring badges", async function () {
    it("should admin transfer badges", async function () {
      const badgeIds = [1];
      await badgeFacet
        .connect(owner)
        .adminTransferBadges(
          await user.getAddress(),
          await owner.getAddress(),
          badgeIds
        );

      const userBalance = await badgeFacet.balanceOf(
        await user.getAddress(),
        badgeIds[0]
      );
      const ownerBalance = await badgeFacet.balanceOf(
        await owner.getAddress(),
        badgeIds[0]
      );

      expect(userBalance).to.equal(0);
      expect(ownerBalance).to.equal(1);
    });

    it("should not allow non-admin to admin transfer badges", async function () {
      const badgeIds = [1];
      await expect(
        badgeFacet
          .connect(user)
          .adminTransferBadges(
            await owner.getAddress(),
            await user.getAddress(),
            badgeIds
          )
      ).to.be.revertedWith("LibDiamond: Must be AGC admin or contract owner");
    });

    it("should not allow normal safeTransferFrom transfers", async function () {
      const badgeIds = [1];
      await expect(
        badgeFacet
          .connect(owner)
          .safeTransferFrom(
            await user.getAddress(),
            await owner.getAddress(),
            badgeIds[0],
            1,
            "0x"
          )
      ).to.be.revertedWithCustomError(badgeFacet, "NonTransferableToken");
    });
  });

  describe("burning badges", async function () {
    it("should allow admin transferring badges to the zero address, and points should be updated, and count should be lowered", async function () {
      const badgeId = 1;

      // First, ensure the owner has the badge
      const ownerAddress = await owner.getAddress();
      const ownerBalance = await badgeFacet.balanceOf(ownerAddress, badgeId);
      if (ownerBalance.eq(0)) {
        await badgeFacet.connect(owner).mintBadge(ownerAddress, badgeId);
      }

      // Get initial points and badge count
      const initialPoints = await badgeFacet.getUserAGCPoints(ownerAddress);
      const initialBadge = (await badgeFacet.getBadges([badgeId]))[0];
      const initialCount = initialBadge.count.toNumber();

      // Get badge rarity to calculate expected points reduction
      const pointsForRarity = await badgeFacet.getPointsForRarity(
        initialBadge.rarity
      );

      // Attempt to burn the badge
      await badgeFacet.connect(owner).burn(ownerAddress, badgeId, 1);

      // Verify the transfer
      const newOwnerBalance = await badgeFacet.balanceOf(ownerAddress, badgeId);
      expect(newOwnerBalance).to.equal(0);

      // Verify points have been updated
      const finalPoints = await badgeFacet.getUserAGCPoints(ownerAddress);
      expect(finalPoints).to.equal(initialPoints.sub(pointsForRarity));

      // Verify badge count has been lowered
      const finalBadge = (await badgeFacet.getBadges([badgeId]))[0];
      expect(finalBadge.count).to.equal(initialCount - 1);
    });

    it("should not allow non-admin to burn badges", async function () {
      const badgeId = 1;
      await expect(
        badgeFacet.connect(user).burn(await owner.getAddress(), badgeId, 1)
      ).to.be.revertedWith("LibDiamond: Must be AGC admin or contract owner");
    });

    it("should not allow burning more than one badge at a time", async function () {
      const badgeId = 1;
      await expect(
        badgeFacet.connect(owner).burn(await user.getAddress(), badgeId, 2)
      ).to.be.revertedWith("Can only burn one badge at a time");
    });
  });

  describe("viewing badges", async function () {
    it("should get all badges when no ids are provided", async function () {
      const badges = await badgeFacet.getBadges([]);
      expect(badges.length).to.be.greaterThan(0);
    });

    it("should get specific badges when ids are provided", async function () {
      const badgeIds = [0, 1, 2];
      const badges = await badgeFacet.getBadges(badgeIds);
      expect(badges.length).to.equal(badgeIds.length);
      for (let i = 0; i < badges.length; i++) {
        expect(badges[i].id).to.equal(badgeIds[i]);
      }
    });

    it("should allow viewing multiple badges in a single get", async function () {
      // First, ensure we have at least 3 badges to test with
      const rarity = 1;
      const gameId = 0;
      const gameTitle = "Test Game";
      const titles = ["Badge 1", "Badge 2", "Badge 3"];
      const description = "Test Description";
      const imageUrl = "arweave/123";
      const badgeId = "ABC123";

      for (let i = 0; i < 3; i++) {
        await badgeFacet
          .connect(owner)
          .addBadge(
            rarity,
            badgeId,
            gameId,
            gameTitle,
            titles[i],
            description,
            imageUrl
          );
      }

      // Now, get multiple badges in a single call
      const badgeIds = [0, 1, 2];
      const badges = await badgeFacet.getBadges(badgeIds);

      // Verify the results
      expect(badges.length).to.equal(badgeIds.length);
    });

    describe("onchain metadata", async function () {
      it("should render on-chain attributes properly", async function () {
        // Add a new badge

        const rarity = 2;
        const gameId = 1;
        const gameTitle = "Test Game";
        const title = "Test Badge";
        const description = "This is a test badge";
        const imageUrl = "arweave/123";
        const badgeId = "ABC123";

        const tx = await badgeFacet
          .connect(owner)
          .addBadge(
            rarity,
            badgeId,
            gameId,
            gameTitle,
            title,
            description,
            imageUrl
          );
        const receipt = await tx.wait();
        const badgeIdFound = receipt?.events?.find(
          (e: any) => e.event === "BadgeAdded"
        )?.args?.id;

        // Get the URI for the newly added badge

        const uri = await badgeFacet.uri(badgeIdFound);

        // Decode the base64 encoded JSON
        const jsonString = Buffer.from(uri.split(",")[1], "base64").toString();
        const metadata = JSON.parse(jsonString);

        // Check if the metadata contains the correct attributes
        expect(metadata.name).to.equal(title);
        expect(metadata.description).to.equal(description);
        expect(metadata.attributes).to.deep.include({
          trait_type: "Rarity",
          value: rarity.toString(),
        });
        expect(metadata.attributes).to.deep.include({
          trait_type: "Game ID",
          value: gameId.toString(),
        });
        expect(metadata["id"]).to.equal(badgeIdFound.toString());

        // Check if the image URL is correctly formed
        expect(metadata.image).to.equal(`https://arweave.net/${imageUrl}`);
      });
    });
  });
});
