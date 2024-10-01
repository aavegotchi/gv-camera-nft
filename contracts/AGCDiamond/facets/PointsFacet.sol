// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorageAGC, Modifiers} from "../../libraries/LibAppStorageAGC.sol";

contract PointsFacet is Modifiers {
    event PointsMinted(address indexed to, uint256 amount);

    function mintPoints(address _to, uint256 _amount) external onlyAGCAdminOrContractOwner {
        LibAppStorageAGC.AppStorageAGC storage ds = LibAppStorageAGC.diamondStorage();
        require(_to != address(0), "PointsFacet: Cannot mint to zero address");
        require(_amount > 0, "PointsFacet: Amount must be greater than zero");

        ds.userToPoints[_to] += _amount;
        emit PointsMinted(_to, _amount);
    }

    function getsPointsForAddresses(address[] calldata _users) external view returns (uint256[] memory) {
        LibAppStorageAGC.AppStorageAGC storage ds = LibAppStorageAGC.diamondStorage();
        uint256[] memory points = new uint256[](_users.length);
        for (uint256 i = 0; i < _users.length; i++) {
            points[i] = ds.userToPoints[_users[i]];
        }
        return points;
    }
}
