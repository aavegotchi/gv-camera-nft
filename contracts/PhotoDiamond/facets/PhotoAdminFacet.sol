// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStoragePhoto, Modifiers} from "../../libraries/LibAppStoragePhoto.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PhotoAdminFacet is Modifiers {
    function setRoyaltyPercentage(uint256 _royaltyPercentage) external onlyContractOwner {
        LibAppStoragePhoto.AppStorage storage ds = LibAppStoragePhoto.diamondStorage();
        ds.royaltyPercentage = _royaltyPercentage;
    }

    function getRoyaltyPercentage() external view returns (uint256) {
        LibAppStoragePhoto.AppStorage storage ds = LibAppStoragePhoto.diamondStorage();
        return ds.royaltyPercentage;
    }
}
