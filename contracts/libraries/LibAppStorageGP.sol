// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStorageGP {
    struct AppStorageGP {
        address agcDiamond;
        address fudContract;
        address fomoContract;
        address alphaContract;
        address kekContract;
        uint256 currentSeason;
        mapping(uint256 => uint256) seasonToMaxPoints;
        mapping(address => uint256) userToSpinsRemaining;
        mapping(uint256 => uint256) seasonPoints;
        mapping(address => uint256) userToPoints;
        mapping(address => uint256) tokenToConversionRate;
        uint256[] wheelPoints; // 0 - 50000
        uint256[] wheelWeights; // 0 - 100
        mapping(address => uint256) userToSpins;
    }

    function diamondStorage() internal pure returns (AppStorageGP storage ds) {
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

    modifier onlyAGCDiamond() {
        require(msg.sender == LibAppStorageGP.diamondStorage().agcDiamond, "LibAppStorageGP: Must be AGC Diamond");
        _;
    }
}
