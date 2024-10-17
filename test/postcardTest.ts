/* global describe it before ethers */

import { getSelectors } from "../scripts/libraries/diamond";
import { assert, expect } from "chai";
import { ethers } from "hardhat";
import {
  DiamondCutFacet,
  DiamondLoupeFacet,
  OwnershipFacet,
  PostcardAdminFacet,
  PostcardFacet,
} from "../src/types";
import { deployPostcardDiamond } from "../scripts/deploy/deployPostcardDiamond";

describe("DiamondTest", async function () {
  let diamondAddress: string;
  let diamondCutFacet: DiamondCutFacet;
  let diamondLoupeFacet: DiamondLoupeFacet;
  let ownershipFacet: OwnershipFacet;
  let postcardFacet: PostcardFacet;
  let postcardAdminFacet: PostcardAdminFacet;
  let result;
  const addresses: string[] = [];
  let owner: any;
  let user1: any;
  let user2: any;

  let user1Balance: number = 0;
  let user2Balance: number = 0;

  before(async function () {
    diamondAddress = await deployPostcardDiamond();
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
    assert.equal(addresses.length, 5);
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

  describe("postcardFacet", async function () {
    beforeEach(async function () {
      [owner, user1, user2] = await ethers.getSigners();
      postcardFacet = await ethers.getContractAt(
        "PostcardFacet",
        diamondAddress
      );
    });

    it("admin should add a postcard", async function () {
      const tx = await postcardFacet.adminAddPostcard(
        "collection1",
        "series1",
        "description1",
        "imageUrl1"
      );

      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "AddPostCard");

      expect(event).to.not.be.undefined;
      expect(event?.args?.collectionName).to.equal("collection1");
      expect(event?.args?.seriesName).to.equal("series1");
      expect(event?.args?.description).to.equal("description1");
      expect(event?.args?.imageUrl).to.equal("imageUrl1");
    });

    it("non admin should not be able to add a postcard", async function () {
      await expect(
        postcardFacet
          .connect(user1)
          .adminAddPostcard(
            "collection1",
            "series1",
            "description1",
            "imageUrl1"
          )
      ).to.be.reverted;
    });

    it("should mint a photo to owner", async function () {
      const tx = await postcardFacet.mintPostcardToOwner(user1.address, 0);
      user1Balance++;

      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e: any) => e.event === "PostcardMinted"
      );

      expect(event).to.not.be.undefined;
      expect(event?.args?.owner).to.equal(user1.address);
      expect(event?.args?.tokenId).to.equal(0);
      expect(event?.args?.quantity).to.equal(1);
    });

    it("should batch mint photos", async function () {
      const tx = await postcardFacet.batchMintPostcards(
        [user1.address, user2.address],
        [0, 1]
      );

      user1Balance++;
      user2Balance++;

      const receipt = await tx.wait();
      const events = receipt.events?.filter(
        (e: any) => e.event === "PostcardMinted"
      );

      expect(events?.length).to.equal(2);
    });

    it("should support erc721 interface", async function () {
      const isERC721 = await diamondLoupeFacet.supportsInterface("0x80ac58cd");
      expect(isERC721).to.be.true;
    });

    it("should support eip2981 interface", async function () {
      const isEIP2981 = await diamondLoupeFacet.supportsInterface("0x2a55205a");

      expect(isEIP2981).to.be.true;
    });

    it("should get photos", async function () {
      await postcardFacet.mintPostcardToOwner(user1.address, 0);

      user1Balance++;

      const photos = await postcardFacet.getPostcards([0]);

      expect(photos.length).to.equal(1);
      expect(photos[0].tokenId).to.equal(0);
    });

    it("should get all photos", async function () {
      const postcards = await postcardFacet.getPostcards([]);
      expect(postcards.length).to.equal(1);
    });

    it("should get postcards balance", async function () {
      await postcardFacet.mintPostcardToOwner(user1.address, 0);
      user1Balance++;

      const balance = await postcardFacet.balanceOf(user1.address, 0);

      expect(balance.toNumber()).to.equal(user1Balance);
    });

    it("should return correct token URI", async function () {
      await postcardFacet.mintPostcardToOwner(user1.address, 0);

      user1Balance++;

      const tokenURI = await postcardFacet.uri(0);

      expect(tokenURI).to.include("data:application/json;base64,");

      const decodedJSON = JSON.parse(atob(tokenURI.split(",")[1]));
      expect(decodedJSON.name).to.equal("gotchiverse");
      expect(decodedJSON.description).to.equal("collection1");
      const attributes = decodedJSON.attributes;
      expect(attributes).to.have.lengthOf(2);
      expect(attributes[0]).to.deep.equal({
        trait_type: "Series Name",
        value: "series1",
      });
      expect(attributes[1]).to.have.property("trait_type", "Minted On");
      expect(attributes[1]).to.have.property("value").that.is.a("string");

      // The timestamp in the contract is stored as a Unix timestamp (seconds since epoch)
      // We need to convert it to a comparable format
      const mintedOnTimestamp = parseInt(decodedJSON.attributes[1].value);
      const mintedOnDate = new Date(mintedOnTimestamp * 1000); // Convert seconds to milliseconds

      // Allow for a small time difference (e.g., 5 seconds) to account for block time variations
      const currentDate = new Date();
      const timeDifference = Math.abs(
        currentDate.getTime() - mintedOnDate.getTime()
      );

      expect(timeDifference).to.be.lessThan(10000); // 10 seconds
      expect(decodedJSON.image).to.include("https://arweave.net/imageUrl1");
    });

    it("nft balance of owner should be correct", async function () {
      const balance = await postcardFacet.balanceOf(user1.address, 0);
      expect(balance.toNumber()).to.equal(user1Balance);
    });

    it("owner cannot transfer nft without approval", async function () {
      await expect(
        postcardFacet
          .connect(user2)
          .safeTransferFrom(user1.address, user2.address, 0, 1, [])
      ).to.be.revertedWithCustomError(
        postcardFacet,
        "ERC1155MissingApprovalForAll"
      );
    });
    it("only nft owner can transfer nft", async function () {
      await expect(
        postcardFacet
          .connect(user1)
          .safeTransferFrom(user1.address, user2.address, 0, 1, [])
      ).to.not.be.reverted;

      user1Balance--;
      user2Balance++;

      const balance = await postcardFacet.balanceOf(user1.address, 0);
      expect(balance.toNumber()).to.equal(user1Balance);
    });
  });

  describe("OwnershipFacet", async function () {
    it("non owner cannot transfer ownership", async function () {
      await expect(
        ownershipFacet.connect(user1).transferOwnership(user2.address)
      ).to.be.reverted;
    });

    it("owner can transfer ownership", async function () {
      const currentOwner = await ownershipFacet.owner();
      expect(currentOwner).to.equal(owner.address);

      await ownershipFacet.transferOwnership(user1.address);

      const newOwner = await ownershipFacet.owner();
      expect(newOwner).to.equal(user1.address);
    });
  });

  describe("PostcardAdminFacet", async function () {
    it("only owner can set minters", async function () {
      postcardAdminFacet = await ethers.getContractAt(
        "PostcardAdminFacet",
        diamondAddress
      );

      await expect(
        postcardAdminFacet.connect(user2).setMinters([user1.address])
      ).to.be.revertedWith("LibDiamond: Must be contract owner");
    });

    it("owner can set minters", async function () {
      postcardAdminFacet = await ethers.getContractAt(
        "PostcardAdminFacet",
        diamondAddress,
        user1
      );
      await postcardAdminFacet.setMinters([user1.address]);

      let minter = await postcardAdminFacet.isMinter(user1.address);
      expect(minter).to.be.true;
    });
  });

  describe("PostcardFacet 2", async function () {
    it("only minter can mint", async function () {
      await expect(
        postcardFacet.connect(user2).mintPostcardToOwner(user1.address, 0)
      ).to.be.revertedWith("LibAppStorage: Must be minter or contract owner");
    });

    it("minter can mint", async function () {
      //add user2 as minter
      postcardAdminFacet = await ethers.getContractAt(
        "PostcardAdminFacet",
        diamondAddress,
        user1
      );
      await postcardAdminFacet.setMinters([user2.address]);

      await expect(
        postcardFacet.connect(user2).mintPostcardToOwner(user1.address, 0)
      ).to.not.be.reverted;
    });
  });
});
