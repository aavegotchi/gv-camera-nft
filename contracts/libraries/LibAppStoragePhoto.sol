// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStoragePhoto {
    struct Photo {
        uint256 tokenId;
        address owner;
        string category;
        string collectionName;
        string seriesName;
        string photoId;
        string photographer;
        address photographerAddress;
        string imageUrl;
        uint256 mintedOn;
    }

    struct AppStorage {
        Photo[] photos;
        uint256 royaltyPercentage;
        mapping(address => bool) minters;
    }

    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    modifier onlyContractOwner() {
        require(msg.sender == LibDiamond.contractOwner(), "LibDiamond: Must be contract owner");
        _;
    }

    modifier onlyMinterOrContractOwner() {
        require(
            LibAppStoragePhoto.diamondStorage().minters[msg.sender] || msg.sender == LibDiamond.contractOwner(),
            "LibAppStorage: Must be minter or contract owner"
        );
        _;
    }
}
