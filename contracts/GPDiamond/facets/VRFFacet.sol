// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorageAGC, Modifiers} from "../../libraries/LibAppStorageAGC.sol";

contract VRFFacet is Modifiers {
    event PointsMinted(address indexed to, uint256 amount);

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
