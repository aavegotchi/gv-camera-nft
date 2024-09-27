// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibDiamond, Modifiers} from "../libraries/LibDiamond.sol";

contract AdminFacet is Modifiers {
    event AGCAdminStatusChanged(address indexed admin, bool isAdmin);

    function setAGCAdmin(address _admin, bool _isAdmin) external onlyContractOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.agcAdmins[_admin] = _isAdmin;
        emit AGCAdminStatusChanged(_admin, _isAdmin);
    }

    function setAGCAdminsBatch(address[] calldata _admins, bool[] calldata _isAdmins) external onlyContractOwner {
        require(_admins.length == _isAdmins.length, "AdminFacet: Input arrays must have the same length");

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        for (uint256 i = 0; i < _admins.length; i++) {
            ds.agcAdmins[_admins[i]] = _isAdmins[i];
            emit AGCAdminStatusChanged(_admins[i], _isAdmins[i]);
        }
    }

    function isAGCAdmin(address _admin) external view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.agcAdmins[_admin];
    }
}
