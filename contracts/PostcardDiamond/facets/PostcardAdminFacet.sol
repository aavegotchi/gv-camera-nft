// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStoragePostcard, Modifiers} from "../../libraries/LibAppStoragePostcard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PostcardAdminFacet is Modifiers {}
