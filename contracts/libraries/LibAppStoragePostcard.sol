// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStoragePostcard {
    struct Postcard {
        uint256 tokenId;
        string category;
        string collectionName;
        string seriesName;
        uint256 seriesNumber;
        string description;
        string imageUrl;
        uint256 mintedOn;
    }

    struct AppStorage {
        Postcard[] postcards;
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
            LibAppStoragePostcard.diamondStorage().minters[msg.sender] || msg.sender == LibDiamond.contractOwner(),
            "LibAppStorage: Must be minter or contract owner"
        );
        _;
    }
}
