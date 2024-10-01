// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStorageAGC {
    struct Game {
        uint256 gameId;
        string gameTitle;
        string gameDescription;
        uint256 lastUpdated;
    }

    struct Badge {
        uint256 id;
        string badgeId; //unique id for backend use
        uint256 rarity;
        uint256 gameId;
        string title;
        string description;
        uint256 earnedOn;
        uint256 count;
        string imageUrl;
    }

    struct AppStorageAGC {
        //Aavegotchi Gaming Console
        mapping(address => bool) agcAdmins;
        address gpDiamond;
        mapping(address => uint256) userToPoints;
        Game[] games;
        mapping(uint256 => Game) idToGame;
        Badge[] badges;
    }

    function diamondStorage() internal pure returns (AppStorageAGC storage ds) {
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

    modifier onlyAGCAdmin() {
        require(LibAppStorageAGC.diamondStorage().agcAdmins[msg.sender], "LibDiamond: Must be AGC admin");
        _;
    }

    modifier onlyAGCAdminOrContractOwner() {
        require(
            msg.sender == LibDiamond.contractOwner() || LibAppStorageAGC.diamondStorage().agcAdmins[msg.sender],
            "LibDiamond: Must be AGC admin or contract owner"
        );
        _;
    }
}
