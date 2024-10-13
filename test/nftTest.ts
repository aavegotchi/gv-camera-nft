/* global describe it before ethers */

import { getSelectors } from "../scripts/libraries/diamond";
import { deployDiamond } from "../scripts/deploy";
import { assert, expect } from "chai";
import { ethers } from "hardhat";
import {
  DiamondCutFacet,
  DiamondLoupeFacet,
  OwnershipFacet,
} from "../src/types";

describe("DiamondTest", async function () {
  let diamondAddress: string;
  let diamondCutFacet: DiamondCutFacet;
  let diamondLoupeFacet: DiamondLoupeFacet;
  let ownershipFacet: OwnershipFacet;
  let tx;
  let receipt;
  let result;
  const addresses: string[] = [];

  before(async function () {
    diamondAddress = await deployDiamond();
    console.log({ diamondAddress });
    diamondCutFacet = (await ethers.getContractAt(
      "DiamondCutFacet",
      diamondAddress
    )) as DiamondCutFacet;
    diamondLoupeFacet = (await ethers.getContractAt(
      "DiamondLoupeFacet",
      diamondAddress
    )) as DiamondLoupeFacet;
    ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;
  });

  it("should have three facets -- call to facetAddresses function", async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }
    console.log({ addresses });
    assert.equal(addresses.length, 3);
  });

  it("facets should have the right function selectors -- call to facetFunctionSelectors function", async () => {
    let selectors = getSelectors(diamondCutFacet);

    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers([...result], selectors);
    selectors = getSelectors(diamondLoupeFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers([...result], selectors);
    selectors = getSelectors(ownershipFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers([...result], selectors);
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

  describe("NFTFacet", async function () {
    let nftFacet: any;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
      [owner, user1, user2] = await ethers.getSigners();
      nftFacet = await ethers.getContractAt("NFTFacet", diamondAddress);
    });

    it("should mint a photo to owner", async function () {
      const tx = await nftFacet.mintPhotoToOwner(
        user1.address,
        "category1",
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      const receipt = await tx.wait();

      console.log("receipt:", receipt.logs);

      const event = receipt.logs?.find((e: any) => e.event === "PhotoMinted");

      console.log({ event });

      expect(event).to.not.be.undefined;
      expect(event?.args?.owner).to.equal(user1.address);
      expect(event?.args?.tokenId).to.equal(0);
      expect(event?.args?.category).to.equal("category1");
      expect(event?.args?.collectionName).to.equal("collection1");
      expect(event?.args?.seriesName).to.equal("series1");
      expect(event?.args?.photoId).to.equal("photo1");
      expect(event?.args?.photographer).to.equal("photographer1");
      expect(event?.args?.photographerAddress).to.equal(user2.address);
      expect(event?.args?.imageUrl).to.equal("imageUrl1");
    });

    it("should batch mint photos", async function () {
      const tx = await nftFacet.batchMintPhotos(
        [user1.address, user2.address],
        ["category1", "category2"],
        ["collection1", "collection2"],
        ["series1", "series2"],
        ["photo1", "photo2"],
        ["photographer1", "photographer2"],
        [user1.address, user2.address],
        ["imageUrl1", "imageUrl2"]
      );

      const receipt = await tx.wait();
      const events = receipt.events?.filter(
        (e: any) => e.event === "PhotoMinted"
      );

      expect(events?.length).to.equal(2);
    });

    it("should return correct royalty info", async function () {
      await nftFacet.mintPhotoToOwner(
        user1.address,
        "category1",
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      const [receiver, royaltyAmount] = await nftFacet.royaltyInfo(0, 1000);

      expect(receiver).to.equal(user2.address);
      expect(royaltyAmount).to.be.gt(0);
    });

    it("should get photos", async function () {
      await nftFacet.mintPhotoToOwner(
        user1.address,
        "category1",
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      const photos = await nftFacet.getPhotos([0]);

      expect(photos.length).to.equal(1);
      expect(photos[0].tokenId).to.equal(0);
      expect(photos[0].owner).to.equal(user1.address);
    });

    it("should get photos length", async function () {
      await nftFacet.mintPhotoToOwner(
        user1.address,
        "category1",
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      const length = await nftFacet.getPhotosLength();

      expect(length).to.equal(1);
    });

    it("should return correct token URI", async function () {
      await nftFacet.mintPhotoToOwner(
        user1.address,
        "category1",
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      const tokenURI = await nftFacet.tokenURI(0);

      expect(tokenURI).to.include("data:application/json;base64,");

      const decodedJSON = JSON.parse(atob(tokenURI.split(",")[1]));
      expect(decodedJSON.name).to.equal("category1");
      expect(decodedJSON.description).to.equal("collection1");
      expect(decodedJSON.attributes[0].value).to.equal("series1");
      expect(decodedJSON.image).to.include("https://arweave.net/imageUrl1");
    });
  });
});
