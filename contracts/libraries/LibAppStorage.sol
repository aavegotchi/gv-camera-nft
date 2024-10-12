// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond} from "./LibDiamond.sol";

library LibAppStorage {
    struct AppStorage {
        address test;
    }

    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    modifier onlyContractOwner() {
        require(
            msg.sender == LibDiamond.contractOwner(),
            "LibDiamond: Must be contract owner"
        );
        _;
    }
}
