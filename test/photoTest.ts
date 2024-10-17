/* global describe it before ethers */

import { getSelectors } from "../scripts/libraries/diamond";
import { assert, expect } from "chai";
import { ethers } from "hardhat";
import {
  DiamondCutFacet,
  DiamondLoupeFacet,
  OwnershipFacet,
  PhotoAdminFacet,
  PhotoFacet,
} from "../src/types";
import { deployPhotoDiamond } from "../scripts/deploy/deployPhotoDiamond";

describe("DiamondTest", async function () {
  let diamondAddress: string;
  let diamondCutFacet: DiamondCutFacet;
  let diamondLoupeFacet: DiamondLoupeFacet;
  let ownershipFacet: OwnershipFacet;
  let photoFacet: PhotoFacet;
  let photoAdminFacet: PhotoAdminFacet;
  let result;
  const addresses: string[] = [];
  let owner: any;
  let user1: any;
  let user2: any;

  let user1Balance: number = 0;
  let user2Balance: number = 0;

  before(async function () {
    diamondAddress = await deployPhotoDiamond();
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

  describe("PhotoFacet", async function () {
    beforeEach(async function () {
      [owner, user1, user2] = await ethers.getSigners();
      photoFacet = await ethers.getContractAt("PhotoFacet", diamondAddress);
      photoAdminFacet = await ethers.getContractAt(
        "PhotoAdminFacet",
        diamondAddress
      );
    });

    it("should have correct name and symbol", async function () {
      expect(await photoFacet.name()).to.equal("Gotchiverse Photos");
      expect(await photoFacet.symbol()).to.equal("GVP");
    });

    it("should have baazaar category interface", async function () {
      const isBaazaarCategory = await diamondLoupeFacet.supportsInterface(
        "0x14f337dc"
      );
      expect(isBaazaarCategory).to.be.true;
    });

    it("should have correct baazaar category", async function () {
      expect(await photoFacet.baazaarCategory(0)).to.equal(
        "gotchiverse.photos"
      );
    });

    it("should mint a photo to owner", async function () {
      const tx = await photoFacet.mintPhotoToOwner(
        user1.address,
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      user1Balance++;

      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "PhotoMinted");

      expect(event).to.not.be.undefined;
      expect(event?.args?.owner).to.equal(user1.address);
      expect(event?.args?.tokenId).to.equal(0);
      expect(event?.args?.category).to.equal("gotchiverse");
      expect(event?.args?.collectionName).to.equal("collection1");
      expect(event?.args?.seriesName).to.equal("series1");
      expect(event?.args?.photoId).to.equal("photo1");
      expect(event?.args?.photographer).to.equal("photographer1");
      expect(event?.args?.photographerAddress).to.equal(user2.address);
      expect(event?.args?.imageUrl).to.equal("imageUrl1");
    });

    it("should batch mint photos", async function () {
      const tx = await photoFacet.batchMintPhotos(
        [user1.address, user2.address],
        ["collection1", "collection2"],
        ["series1", "series2"],
        ["photo1", "photo2"],
        ["photographer1", "photographer2"],
        [user1.address, user2.address],
        ["imageUrl1", "imageUrl2"]
      );

      user1Balance++;
      user2Balance++;

      const receipt = await tx.wait();
      const events = receipt.events?.filter(
        (e: any) => e.event === "PhotoMinted"
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

    it("should return correct royalty info", async function () {
      await photoFacet.mintPhotoToOwner(
        user1.address,
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      const royaltyPercentage = await photoAdminFacet.getRoyaltyPercentage();

      const salePrice = ethers.utils.parseEther("1");

      const [receiver, royaltyAmount] = await photoFacet.royaltyInfo(
        0,
        salePrice
      );

      const expectedRoyaltyAmount = salePrice.mul(royaltyPercentage).div(10000);

      expect(receiver).to.equal(user2.address);
      expect(royaltyAmount).to.equal(expectedRoyaltyAmount);

      user1Balance++;
    });

    it("should get photos", async function () {
      await photoFacet.mintPhotoToOwner(
        user1.address,
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      user1Balance++;

      const photos = await photoFacet.getPhotos([0]);

      expect(photos.length).to.equal(1);
      expect(photos[0].tokenId).to.equal(0);
      expect(photos[0].owner).to.equal(user1.address);
    });

    it("should get all photos", async function () {
      const photos = await photoFacet.getPhotos([]);
      expect(photos.length).to.equal(user1Balance + user2Balance);
    });

    it("should get photos length", async function () {
      await photoFacet.mintPhotoToOwner(
        user1.address,
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      user1Balance++;

      const length = await photoFacet.getPhotosLength();

      expect(length.toNumber()).to.equal(user1Balance + user2Balance);
    });

    it("should return correct token URI", async function () {
      await photoFacet.mintPhotoToOwner(
        user1.address,
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      user1Balance++;

      const tokenURI = await photoFacet.tokenURI(0);

      expect(tokenURI).to.include("data:application/json;base64,");

      const decodedJSON = JSON.parse(atob(tokenURI.split(",")[1]));

      // expect(decodedJSON.category).to.equal("gotchiverse");
      expect(decodedJSON.name).to.equal("gotchiverse");
      expect(decodedJSON.description).to.equal("collection1");
      expect(decodedJSON.attributes[0].value).to.equal("series1");
      expect(decodedJSON.attributes[1].value).to.equal("photographer1");
      expect(decodedJSON.attributes[2].value).to.equal("photo1");

      // The timestamp in the contract is stored as a Unix timestamp (seconds since epoch)
      // We need to convert it to a comparable format
      const mintedOnTimestamp = parseInt(decodedJSON.attributes[3].value);
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
      const balance = await photoFacet.balanceOf(user1.address);
      expect(balance.toNumber()).to.equal(user1Balance);
    });

    it("owner cannot transfer nft without approval", async function () {
      await expect(
        photoFacet
          .connect(user2)
          ["safeTransferFrom(address,address,uint256)"](
            user1.address,
            user2.address,
            0
          )
      ).to.be.revertedWithCustomError(photoFacet, "ERC721InsufficientApproval");
    });
    it("only nft owner can transfer nft", async function () {
      await expect(
        photoFacet
          .connect(user1)
          ["safeTransferFrom(address,address,uint256)"](
            user1.address,
            user2.address,
            0
          )
      ).to.not.be.reverted;

      user1Balance--;
      user2Balance++;

      const balance = await photoFacet.balanceOf(user2.address);
      expect(balance.toNumber()).to.equal(user2Balance);
    });

    it("minter can mint", async function () {
      const tx = await photoFacet.mintPhotoToOwner(
        user1.address,
        "collection1",
        "series1",
        "photo1",
        "photographer1",
        "imageUrl1",
        user2.address
      );

      user1Balance++;
    });

    it("non minter cannot mint", async function () {
      photoFacet = await ethers.getContractAt(
        "PhotoFacet",
        diamondAddress,
        user2
      );

      await expect(
        photoFacet.mintPhotoToOwner(
          user1.address,
          "collection1",
          "series1",
          "photo1",
          "photographer1",
          "imageUrl1",
          user2.address
        )
      ).to.be.reverted;
    });
  });

  describe("AdminFacet", async function () {
    it("should set royalty percentage", async function () {
      const tx = await photoAdminFacet.setRoyaltyPercentage(5000);
      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e: any) => e.event === "RoyaltyPercentageUpdated"
      );

      const royaltyPercentage = await photoAdminFacet.getRoyaltyPercentage();
      expect(royaltyPercentage.toNumber()).to.equal(5000);
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
});
