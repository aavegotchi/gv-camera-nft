// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibAppStorage} from "./LibAppStorage.sol";
library LibAGCPoints {
    event PointsMinted(address indexed to, uint256 amount);

    function _mintPoints(address _to, uint256 _amount) internal {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        ds.userToAGCPoints[_to] += _amount;
        emit PointsMinted(_to, _amount);
    }
}
