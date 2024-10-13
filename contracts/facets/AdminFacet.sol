// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStorage, Modifiers} from "../libraries/LibAppStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AdminFacet is Modifiers {
    function setRoyaltyPercentage(uint256 _royaltyPercentage) external onlyContractOwner {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        ds.royaltyPercentage = _royaltyPercentage;
    }

    function getRoyaltyPercentage() external view returns (uint256) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        return ds.royaltyPercentage;
    }
}
