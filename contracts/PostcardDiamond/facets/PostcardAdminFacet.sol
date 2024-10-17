// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStoragePostcard, Modifiers} from "../../libraries/LibAppStoragePostcard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PostcardAdminFacet is Modifiers {
    function setMinters(address[] memory _minters) external onlyContractOwner {
        LibAppStoragePostcard.AppStorage storage ds = LibAppStoragePostcard.diamondStorage();
        for (uint256 i = 0; i < _minters.length; i++) {
            ds.minters[_minters[i]] = true;
        }
    }

    function isMinter(address _address) external view returns (bool) {
        return LibAppStoragePostcard.diamondStorage().minters[_address];
    }
}
