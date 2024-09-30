// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorageAGC, Modifiers} from "../../libraries/LibAppStorageAGC.sol";

contract AdminFacet is Modifiers {
    event AGCAdminStatusChanged(address indexed admin, bool isAdmin);

    function setAGCAdmin(address _admin, bool _isAdmin) external onlyContractOwner {
        LibAppStorageAGC.AppStorageAGC storage ds = LibAppStorageAGC.diamondStorage();
        ds.agcAdmins[_admin] = _isAdmin;
        emit AGCAdminStatusChanged(_admin, _isAdmin);
    }

    function setAGCAdminsBatch(address[] calldata _admins, bool[] calldata _isAdmins) external onlyContractOwner {
        require(_admins.length == _isAdmins.length, "AdminFacet: Input arrays must have the same length");

        LibAppStorageAGC.AppStorageAGC storage ds = LibAppStorageAGC.diamondStorage();

        for (uint256 i = 0; i < _admins.length; i++) {
            ds.agcAdmins[_admins[i]] = _isAdmins[i];
            emit AGCAdminStatusChanged(_admins[i], _isAdmins[i]);
        }
    }

    function setGPDiamond(address _gpDiamond) external onlyContractOwner {
        LibAppStorageAGC.AppStorageAGC storage ds = LibAppStorageAGC.diamondStorage();
        ds.gpDiamond = _gpDiamond;
    }

    function gpDiamond() external view returns (address) {
        LibAppStorageAGC.AppStorageAGC storage ds = LibAppStorageAGC.diamondStorage();
        return ds.gpDiamond;
    }

    function isAGCAdmin(address _admin) external view returns (bool) {
        LibAppStorageAGC.AppStorageAGC storage ds = LibAppStorageAGC.diamondStorage();
        return ds.agcAdmins[_admin];
    }
}
