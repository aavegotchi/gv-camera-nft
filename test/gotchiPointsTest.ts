import { Contract } from "ethers";
import { ethers } from "hardhat";
//@ts-ignore
import { describe, it, before } from "mocha";
import { deployGPDiamond } from "../scripts/deployGPDiamond";
import { getSelectors } from "../scripts/libraries/diamond";
import { expect } from "chai";
import {
  AdminFacet,
  Alchemica,
  DiamondCutFacet,
  DiamondLoupeFacet,
  GotchiPointsFacet,
  OwnershipFacet,
  VRFFacet,
  WheelFacet,
} from "../src/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { deployAGCDiamond } from "../scripts/deployAGCDiamond";

const { assert } = require("chai");

let agcDiamondAddress: string;
let gpDiamondAddress: string;
let diamondCutFacet: DiamondCutFacet;
let diamondLoupeFacet: DiamondLoupeFacet;
let ownershipFacet: OwnershipFacet;
let wheelFacet: WheelFacet;
let result;
const addresses: string[] = [];

describe("DiamondTest", async function () {
  before(async function () {
    agcDiamondAddress = await deployAGCDiamond();

    gpDiamondAddress = await deployGPDiamond(agcDiamondAddress);
    diamondCutFacet = await ethers.getContractAt(
      "DiamondCutFacet",
      gpDiamondAddress
    );
    diamondLoupeFacet = await ethers.getContractAt(
      "DiamondLoupeFacet",
      gpDiamondAddress
    );
    ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      gpDiamondAddress
    );
  });

  it("should have three facets -- call to facetAddresses function", async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 5);
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
    expect(facets.length).to.equal(5);
    // You can add more specific checks for each facet if needed
  });
});

let gotchiPointsFacet: GotchiPointsFacet;
let owner: SignerWithAddress;
let nonOwner: SignerWithAddress;
let admin1: SignerWithAddress;
let admin2: SignerWithAddress;

describe("GotchiPointsFacet", async function () {
  before(async () => {
    [owner, nonOwner, admin1, admin2] = await ethers.getSigners();
    gotchiPointsFacet = await ethers.getContractAt(
      "GotchiPointsFacet",
      gpDiamondAddress
    );

    //Set the GP Diamond address in the AGCDiamond
    const adminFacet = await ethers.getContractAt(
      "AdminFacet",
      agcDiamondAddress
    );
    await adminFacet.connect(owner).setGPDiamond(gpDiamondAddress);

    expect(await adminFacet.gpDiamond()).to.equal(gpDiamondAddress);

    //check agc diamond address in wheel facet
    const wheelFacet = await ethers.getContractAt(
      "WheelFacet",
      gpDiamondAddress
    );
    expect(await wheelFacet.agcDiamond()).to.equal(agcDiamondAddress);

    //set agc admins
    const agcAdmins = [owner.address, admin1.address, admin2.address];
    const isAdmin = [true, true, true];
    await adminFacet.connect(owner).setAGCAdminsBatch(agcAdmins, isAdmin);

    expect(await adminFacet.isAGCAdmin(owner.address)).to.equal(true);
    expect(await adminFacet.isAGCAdmin(admin1.address)).to.equal(true);
    expect(await adminFacet.isAGCAdmin(admin2.address)).to.equal(true);
  });

  describe("converting parcels and alchemica to points", async function () {
    it("should be able to convert parcels to points", async () => {
      //todo
      //check that the parcel leaves the wallet
      //check that points are minted to the wallet and increase in the contract
      //check that the parcel is burned
    });

    //todo

    it("should be able to convert alchemica to points", async () => {
      // Mock Alchemica tokens
      const fud = (await ethers.getContractAt(
        "Alchemica",
        await gotchiPointsFacet.fudContract()
      )) as Alchemica;
      const fomo = (await ethers.getContractAt(
        "Alchemica",
        await gotchiPointsFacet.fomoContract()
      )) as Alchemica;
      const alpha = (await ethers.getContractAt(
        "Alchemica",
        await gotchiPointsFacet.alphaContract()
      )) as Alchemica;
      const kek = (await ethers.getContractAt(
        "Alchemica",
        await gotchiPointsFacet.kekContract()
      )) as Alchemica;

      // Set conversion rates
      await gotchiPointsFacet.connect(owner).adjustConversionRate(1, 2, 3, 4);

      //set season max points to 100000
      await gotchiPointsFacet
        .connect(owner)
        .setSeasonTotals(0, parseEther("100000"));
      // Mint some tokens to the user
      const amount = ethers.utils.parseEther("100");
      await fud.mint(nonOwner.address, amount);
      await fomo.mint(nonOwner.address, amount);
      await alpha.mint(nonOwner.address, amount);
      await kek.mint(nonOwner.address, amount);

      // Approve the diamond contract to spend tokens
      await fud.connect(nonOwner).approve(gpDiamondAddress, amount);
      await fomo.connect(nonOwner).approve(gpDiamondAddress, amount);
      await alpha.connect(nonOwner).approve(gpDiamondAddress, amount);
      await kek.connect(nonOwner).approve(gpDiamondAddress, amount);

      // Get initial balances
      const initialFudBalance = await fud.balanceOf(nonOwner.address);
      const initialFomoBalance = await fomo.balanceOf(nonOwner.address);
      const initialAlphaBalance = await alpha.balanceOf(nonOwner.address);
      const initialKekBalance = await kek.balanceOf(nonOwner.address);
      const initialPoints = await gotchiPointsFacet.getUserPoints(
        nonOwner.address
      );

      // Convert alchemica to points
      const tx = await gotchiPointsFacet
        .connect(nonOwner)
        .convertAlchemica(
          nonOwner.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("20"),
          ethers.utils.parseEther("30"),
          ethers.utils.parseEther("40")
        );

      // Check that the alchemica left the wallet
      expect(await fud.balanceOf(nonOwner.address)).to.equal(
        initialFudBalance.sub(ethers.utils.parseEther("10"))
      );
      expect(await fomo.balanceOf(nonOwner.address)).to.equal(
        initialFomoBalance.sub(ethers.utils.parseEther("20"))
      );
      expect(await alpha.balanceOf(nonOwner.address)).to.equal(
        initialAlphaBalance.sub(ethers.utils.parseEther("30"))
      );
      expect(await kek.balanceOf(nonOwner.address)).to.equal(
        initialKekBalance.sub(ethers.utils.parseEther("40"))
      );

      // Calculate expected points
      const expectedPoints = ethers.utils
        .parseEther("10")
        .mul(1)
        .add(ethers.utils.parseEther("20").mul(2))
        .add(ethers.utils.parseEther("30").mul(3))
        .add(ethers.utils.parseEther("40").mul(4));

      // Check that points were minted to the wallet and increased in the contract
      const finalPoints = await gotchiPointsFacet.getUserPoints(
        nonOwner.address
      );

      expect(finalPoints).to.equal(initialPoints.add(expectedPoints));

      const season = await gotchiPointsFacet.currentSeason();

      // Check for PointsMinted event
      await expect(tx)
        .to.emit(gotchiPointsFacet, "PointsMinted")
        .withArgs(nonOwner.address, season, expectedPoints);
    });
  });

  describe("admin adjustment functions", async function () {
    it("should be able to adjust conversion rate", async () => {
      const newFudRate = 2;
      const newFomoRate = 3;
      const newAlphaRate = 4;
      const newKekRate = 5;

      // Adjust conversion rates
      await expect(
        gotchiPointsFacet
          .connect(owner)
          .adjustConversionRate(
            newFudRate,
            newFomoRate,
            newAlphaRate,
            newKekRate
          )
      )
        .to.emit(gotchiPointsFacet, "ConversionRateAdjusted")
        .withArgs(await gotchiPointsFacet.fudContract(), newFudRate)
        .to.emit(gotchiPointsFacet, "ConversionRateAdjusted")
        .withArgs(await gotchiPointsFacet.fomoContract(), newFomoRate)
        .to.emit(gotchiPointsFacet, "ConversionRateAdjusted")
        .withArgs(await gotchiPointsFacet.alphaContract(), newAlphaRate)
        .to.emit(gotchiPointsFacet, "ConversionRateAdjusted")
        .withArgs(await gotchiPointsFacet.kekContract(), newKekRate);

      // Verify new conversion rates
      const tx = await gotchiPointsFacet
        .connect(nonOwner)
        .convertAlchemica(
          nonOwner.address,
          ethers.utils.parseEther("10"),
          ethers.utils.parseEther("20"),
          ethers.utils.parseEther("30"),
          ethers.utils.parseEther("40")
        );

      const expectedPoints = ethers.utils
        .parseEther("10")
        .mul(newFudRate)
        .add(ethers.utils.parseEther("20").mul(newFomoRate))
        .add(ethers.utils.parseEther("30").mul(newAlphaRate))
        .add(ethers.utils.parseEther("40").mul(newKekRate));

      const season = await gotchiPointsFacet.currentSeason();

      await expect(tx)
        .to.emit(gotchiPointsFacet, "PointsMinted")
        .withArgs(nonOwner.address, season, expectedPoints);

      // Ensure only owner can adjust rates
      await expect(
        gotchiPointsFacet.connect(nonOwner).adjustConversionRate(1, 1, 1, 1)
      ).to.be.revertedWith("LibDiamond: Must be contract owner");
    });

    it("should be able to increment season", async () => {
      //todo

      const initialSeason = await gotchiPointsFacet.currentSeason();

      // Only owner should be able to increment season
      await expect(
        gotchiPointsFacet.connect(nonOwner).incrementSeason()
      ).to.be.revertedWith("LibDiamond: Must be contract owner");

      // Owner increments season
      await expect(gotchiPointsFacet.connect(owner).incrementSeason()).to.not.be
        .reverted;

      const newSeason = await gotchiPointsFacet.currentSeason();
      expect(newSeason).to.equal(initialSeason.add(1));

      // Increment again to ensure it's working correctly
      await gotchiPointsFacet.connect(owner).incrementSeason();
      const finalSeason = await gotchiPointsFacet.currentSeason();
      expect(finalSeason).to.equal(initialSeason.add(2));
    });

    it("should be able to set season totals", async () => {
      //todo

      const currentSeason = await gotchiPointsFacet.currentSeason();

      const beforeSetSeasonMaxPoints =
        await gotchiPointsFacet.getSeasonMaxPoints(currentSeason);

      // Only owner should be able to set season totals
      await expect(
        gotchiPointsFacet.connect(nonOwner).setSeasonTotals(1, 1)
      ).to.be.revertedWith("LibDiamond: Must be contract owner");

      // Owner sets season totals
      await expect(
        gotchiPointsFacet
          .connect(owner)
          .setSeasonTotals(currentSeason, beforeSetSeasonMaxPoints.add(1))
      ).to.not.be.reverted;

      let afterSetSeasonMaxPoints = await gotchiPointsFacet.getSeasonMaxPoints(
        currentSeason
      );

      expect(afterSetSeasonMaxPoints).to.equal(beforeSetSeasonMaxPoints.add(1));
    });

    it("points should not be able to exceed season max points", async () => {
      //todo

      // Set up initial conditions
      const currentSeason = await gotchiPointsFacet.currentSeason();
      const initialMaxPoints = ethers.utils.parseEther("1000");

      // Set season max points
      await gotchiPointsFacet
        .connect(owner)
        .setSeasonTotals(currentSeason, initialMaxPoints);

      // Mock Alchemica tokens
      const fud = await ethers.getContractAt(
        "Alchemica",
        await gotchiPointsFacet.fudContract()
      );

      // Set conversion rates
      await gotchiPointsFacet.connect(owner).adjustConversionRate(1, 1, 1, 1);

      // Mint tokens to user
      const tokenAmount = initialMaxPoints.add(1); // Slightly more than max points
      await fud.mint(admin1.address, tokenAmount);
      await fud.connect(admin1).approve(gpDiamondAddress, tokenAmount);

      // Convert tokens to points
      await expect(
        gotchiPointsFacet
          .connect(admin1)
          .convertAlchemica(admin1.address, tokenAmount, 0, 0, 0)
      ).to.be.revertedWith("Exceeds season max points");

      // Verify points were not added
      const userPoints = await gotchiPointsFacet.getUserPoints(admin1.address);
      expect(userPoints).to.equal(0);

      // Convert tokens up to max points
      await expect(
        gotchiPointsFacet
          .connect(admin1)
          .convertAlchemica(admin1.address, initialMaxPoints, 0, 0, 0)
      ).to.not.be.reverted;

      // Verify points were added
      const finalUserPoints = await gotchiPointsFacet.getUserPoints(
        admin1.address
      );
      expect(finalUserPoints).to.equal(initialMaxPoints);

      // Attempt to add more points
      await expect(
        gotchiPointsFacet
          .connect(admin1)
          .convertAlchemica(admin1.address, 1, 0, 0, 0)
      ).to.be.revertedWith("Exceeds season max points");
    });
  });

  describe("view functions", async function () {
    it("should be able to view current season", async () => {
      //todo

      const currentSeason = await gotchiPointsFacet.currentSeason();
      expect(currentSeason).to.equal(2);
    });

    it("should be able to view season totals", async () => {
      //todo
      const currentSeason = await gotchiPointsFacet.currentSeason();
      const seasonMaxPoints = await gotchiPointsFacet.getSeasonMaxPoints(
        currentSeason
      );
      //we set season max points to 1000 in the function above
      expect(seasonMaxPoints).to.equal(ethers.utils.parseEther("1000"));
    });
  });
});

describe("WheelFacet", async function () {
  before(async () => {
    [owner, nonOwner, admin1, admin2] = await ethers.getSigners();
    wheelFacet = await ethers.getContractAt("WheelFacet", gpDiamondAddress);
  });

  it("admin should be able to adjust wheel weights and wheel points", async () => {
    // Define new wheel weights and points
    const newPoints = [100, 200, 300, 400];
    const newWeights = [1000, 2000, 3000, 4000]; //10%, 20%, 30%, 40%

    // Adjust wheel weights
    await expect(
      wheelFacet.connect(owner).adjustWheelWeights(newWeights, newPoints)
    )
      .to.emit(wheelFacet, "WheelWeightsAdjusted")
      .withArgs(newWeights, newPoints);

    // Verify wheel weights were updated
    const updatedWeights = (await wheelFacet.getWheelWeights())[0];
    expect(updatedWeights).to.deep.equal(newWeights);

    // Verify wheel points were updated
    const updatedPoints = (await wheelFacet.getWheelWeights())[1];
    expect(updatedPoints).to.deep.equal(newPoints);

    // Non-admin should not be able to adjust wheel weights or points
    await expect(
      wheelFacet.connect(nonOwner).adjustWheelWeights(newWeights, newPoints)
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });

  it("should not be able to adjust wheel weights that don't add up to 10000", async () => {
    const newWeights = [0, 2000, 3000, 4000];
    const newPoints = [100, 200, 300, 400];

    await expect(
      wheelFacet.connect(owner).adjustWheelWeights(newWeights, newPoints)
    ).to.be.revertedWith("WheelFacet: Wheel weights must add up to 10000");
  });
});

describe("spinning the wheel", async function () {
  it("should be able to earn spins from earning badges", async () => {
    // Get the BadgeFacet from the AGCDiamond
    const badgeFacet = await ethers.getContractAt(
      "BadgeFacet",
      agcDiamondAddress
    );

    // User earns a badge
    const badgeId = 0;
    const rarity = 0;

    const spinsToGrant = await wheelFacet.getSpinsForBadge(rarity);

    //add a new badge
    await badgeFacet.connect(owner).addBadge(rarity, 1, "test", "test", "test");

    // Check if spins were granted
    const spinsBeforeEarning = await wheelFacet.getUserSpins(nonOwner.address);

    //mint the badge to the user
    await badgeFacet.connect(owner).mintBadge(nonOwner.address, badgeId);

    const spinsAfterEarning = await wheelFacet.getUserSpins(nonOwner.address);

    expect(spinsAfterEarning).to.equal(spinsBeforeEarning.add(spinsToGrant));
  });

  it("only agc diamond should be able to call grant spins", async () => {
    const nonAGCDiamondSigner = nonOwner;
    const userAddress = admin1.address;
    const rarity = 1;

    // Attempt to call grantSpins from a non-AGC Diamond address
    await expect(
      wheelFacet.connect(nonAGCDiamondSigner).grantSpins(userAddress, rarity)
    ).to.be.revertedWith("LibAppStorageGP: Must be AGC Diamond");

    // Verify that spins were not granted
    const spinsAfterAttempt = await wheelFacet.getUserSpins(userAddress);
    expect(spinsAfterAttempt).to.equal(0);
  });

  it("user with spins should be able to spin the wheel", async () => {
    //increase season max points
    const currentSeason = await gotchiPointsFacet.currentSeason();
    await gotchiPointsFacet
      .connect(owner)
      .setSeasonTotals(currentSeason, ethers.utils.parseEther("1000000000"));

    // Grant spins to the user
    const userAddress = nonOwner.address;

    // Get initial spins and points
    const initialSpins = await wheelFacet.getUserSpins(userAddress);
    const initialPoints = await gotchiPointsFacet.getUserPoints(userAddress);

    expect(initialSpins).to.be.gt(0);

    // Spin the wheel
    await wheelFacet.connect(nonOwner).spinWheel();

    // Check if spins were deducted
    const finalSpins = await wheelFacet.getUserSpins(userAddress);
    expect(finalSpins).to.equal(initialSpins.sub(1));

    // Check if points were awarded
    const finalPoints = await gotchiPointsFacet.getUserPoints(userAddress);
    expect(finalPoints).to.be.gt(initialPoints);

    // Verify the WheelSpinResult event was emitted
    await expect(wheelFacet.connect(nonOwner).spinWheel()).to.emit(
      wheelFacet,
      "WheelSpinResult"
    );
  });

  it("user should not be able to spin the wheel if no spins are available", async () => {
    // Get initial spins for the user
    const userAddress = nonOwner.address;
    const initialSpins = await wheelFacet.getUserSpins(userAddress);

    // If the user has any spins, use them up
    if (initialSpins.gt(0)) {
      for (let i = 0; i < initialSpins.toNumber(); i++) {
        await wheelFacet.connect(nonOwner).spinWheel();
      }
    }

    // Verify the user has no spins left
    const spinsAfterUsingAll = await wheelFacet.getUserSpins(userAddress);
    expect(spinsAfterUsingAll).to.equal(0);

    // Attempt to spin the wheel with no spins
    await expect(wheelFacet.connect(nonOwner).spinWheel()).to.be.revertedWith(
      "LibGotchiPoints: No spins remaining"
    );

    // Verify spins are still 0
    const finalSpins = await wheelFacet.getUserSpins(userAddress);
    expect(finalSpins).to.equal(0);
  });

  it("admin should be able to spin the wheel without using spins", async () => {
    // Spin the wheel without using spins
    await wheelFacet.connect(owner).testSpinWheel();

    // Verify the WheelSpinResult event was emitted
    await expect(wheelFacet.connect(owner).testSpinWheel()).to.emit(
      wheelFacet,
      "WheelSpinResult"
    );
  });

  it("min points from spinning the wheel should be 0, and max points should be 50000", async () => {
    //update the wheel weights to the following:
    //   50	45.00%
    // 200	23.00%
    // 500	16.00%
    // 1500	8.00%
    // 5000	2.50%
    // 50000	0.50%
    // 0	5.00%

    // Update wheel weights and points
    const newWeights = [4500, 2300, 1600, 800, 250, 50, 500];
    const newPoints = [50, 200, 500, 1500, 5000, 50000, 0];

    // Adjust wheel weights and points
    await wheelFacet.connect(owner).adjustWheelWeights(newWeights, newPoints);

    // Verify the new wheel configuration
    const [updatedWeights, updatedPoints] = await wheelFacet.getWheelWeights();

    expect(updatedWeights).to.deep.equal(newWeights);
    expect(updatedPoints).to.deep.equal(newPoints);

    const minPoints = 0;
    const maxPoints = 50000;
    const pointsCount: { [key: string]: number } = {};
    const totalSpins = 500;

    for (let index = 0; index < totalSpins; index++) {
      const tx = await wheelFacet.connect(owner).testSpinWheel();
      const receipt = await tx.wait();
      const event = receipt.events?.find((e) => e.event === "WheelSpinResult");
      const points = event?.args?.pointsWon.toString();

      if (points) {
        pointsCount[points] = (pointsCount[points] || 0) + 1;
      }

      //log out the spin # and how many points
      // console.log(`Spin ${index}: ${points} points`);

      expect(Number(points)).to.be.gte(minPoints);
      expect(Number(points)).to.be.lte(maxPoints);
    }

    console.log("Points distribution:");
    for (const [points, count] of Object.entries(pointsCount)) {
      const percentage = (count / totalSpins) * 100;
      console.log(
        `${points} points: ${count} spins (${percentage.toFixed(2)}%)`
      );
    }
  });
});

//only agc admins should be able to call the functions in the WheelFacet

// describe("VRFFacet", async function () {
//   before(async () => {
//     [owner, nonOwner, admin1, admin2] = await ethers.getSigners();
//     vrfFacet = await ethers.getContractAt("VRFFacet", diamondAddress);
//   });
// });
