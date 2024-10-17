// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStoragePostcard {
    struct Postcard {
        string category;
        string collectionName;
        string seriesName;
        uint256 seriesNumber;
        string description;
        string imageUrl;
        uint256 mintedOn;
    }

    struct AppStorage {
        address minter;
        Postcard[] postcards;
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
            msg.sender == LibAppStoragePostcard.diamondStorage().minter || msg.sender == LibDiamond.contractOwner(),
            "LibAppStorage: Must be minter or contract owner"
        );
        _;
    }
}
