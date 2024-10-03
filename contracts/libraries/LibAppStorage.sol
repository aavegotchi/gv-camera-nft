// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStorage {
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

    struct AppStorage {
        //Aavegotchi Gaming Console
        mapping(address => bool) agcAdmins;
        address gpDiamond;
        mapping(address => uint256) userToAGCPoints;
        Game[] games;
        mapping(uint256 => Game) idToGame;
        Badge[] badges;
        //
        //GOTCHI Points
        //
        address agcDiamond;
        address fudContract;
        address fomoContract;
        address alphaContract;
        address kekContract;
        uint256 currentSeason;
        mapping(uint256 => uint256) seasonToMaxPoints;
        mapping(address => uint256) userToSpinsRemaining;
        mapping(uint256 => uint256) seasonPoints;
        mapping(address => uint256) userToGotchiPoints;
        mapping(address => uint256) tokenToConversionRate;
        uint256[] wheelPoints; // 0 - 50000
        uint256[] wheelWeights; // 0 - 100
        mapping(address => uint256) userToSpins;
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

    modifier onlyAGCAdmin() {
        require(LibAppStorage.diamondStorage().agcAdmins[msg.sender], "LibDiamond: Must be AGC admin");
        _;
    }

    modifier onlyAGCAdminOrContractOwner() {
        require(
            msg.sender == LibDiamond.contractOwner() || LibAppStorage.diamondStorage().agcAdmins[msg.sender],
            "LibDiamond: Must be AGC admin or contract owner"
        );
        _;
    }
}
