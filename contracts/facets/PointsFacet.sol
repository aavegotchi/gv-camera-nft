// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorage, Modifiers} from "../libraries/LibAppStorage.sol";

contract PointsFacet is Modifiers {
    event PointsMinted(address indexed to, uint256 amount);

    function mintPoints(address _to, uint256 _amount) public onlyAGCAdminOrContractOwner {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        require(_to != address(0), "PointsFacet: Cannot mint to zero address");
        require(_amount > 0, "PointsFacet: Amount must be greater than zero");

        ds.userToAGCPoints[_to] += _amount;
        emit PointsMinted(_to, _amount);
    }

    //batch version
    function batchMintPoints(address[] calldata _users, uint256[] calldata _amounts) external onlyAGCAdminOrContractOwner {
        require(_users.length == _amounts.length, "PointsFacet: Users and amounts arrays must have the same length");
        for (uint256 i = 0; i < _users.length; i++) {
            mintPoints(_users[i], _amounts[i]);
        }
    }

    function getsPointsForAddresses(address[] calldata _users) external view returns (uint256[] memory) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        uint256[] memory points = new uint256[](_users.length);
        for (uint256 i = 0; i < _users.length; i++) {
            points[i] = ds.userToAGCPoints[_users[i]];
        }
        return points;
    }
}
