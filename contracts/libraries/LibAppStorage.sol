// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStorage {
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
        address minter;
        Photo[] photos;
        uint256 royaltyPercentage;
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
            msg.sender == LibAppStorage.diamondStorage().minter || msg.sender == LibDiamond.contractOwner(),
            "LibAppStorage: Must be minter or contract owner"
        );
        _;
    }
}
