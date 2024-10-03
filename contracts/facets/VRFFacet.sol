// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorage, Modifiers} from "../libraries/LibAppStorage.sol";

contract VRFFacet is Modifiers {
    function spinWheel() external {
        //spin the wheel
    }

    function adjustWheelWeights() external onlyContractOwner {
        //adjust the wheel weights
    }

    function viewWheelWeights() external view returns (uint256) {
        //view the wheel weights
    }
}
