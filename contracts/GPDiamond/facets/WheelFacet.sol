// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorageGP, Modifiers} from "../../libraries/LibAppStorageGP.sol";
import {GotchiPointsFacet} from "./GotchiPointsFacet.sol";
import {LibGotchiPoints} from "../../libraries/LibGotchiPoints.sol";

contract WheelFacet is Modifiers {
    event WheelWeightsAdjusted(uint256[] wheelWeights, uint256[] wheelPoints);

    event SpinsGranted(address indexed user, uint256 amount);

    function agcDiamond() external view returns (address) {
        return LibAppStorageGP.diamondStorage().agcDiamond;
    }

    //Should change this to an internal function where Spins are granted by the BadgeFacet
    function grantSpins(address _user, uint256 _rarity) public onlyAGCDiamond {
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();
        s.userToSpins[_user] += getSpinsForBadge(_rarity);
        emit SpinsGranted(_user, getSpinsForBadge(_rarity));
    }

    function spinWheel() external {
        LibGotchiPoints._spinWheel(true);
    }

    function testSpinWheel() external onlyContractOwner {
        //todo: for testing only, remove in production
        LibGotchiPoints._spinWheel(false);
    }

    function adjustWheelWeights(uint256[] calldata _wheelWeights, uint256[] calldata _wheelPoints) external onlyContractOwner {
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();

        //check that the arrays are the same length
        require(_wheelPoints.length == _wheelWeights.length, "WheelFacet: Arrays must be the same length");

        //wheel weights should add up exactly to 10000
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < _wheelWeights.length; i++) {
            totalWeight += _wheelWeights[i];
        }

        require(totalWeight == 10000, "WheelFacet: Wheel weights must add up to 10000");

        s.wheelPoints = _wheelPoints;
        s.wheelWeights = _wheelWeights;

        emit WheelWeightsAdjusted(_wheelWeights, _wheelPoints);
    }

    function getWheelWeights() external view returns (uint256[] memory, uint256[] memory) {
        //view the wheel weights
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();
        return (s.wheelWeights, s.wheelPoints);
    }

    function getUserSpins(address _user) external view returns (uint256) {
        return LibAppStorageGP.diamondStorage().userToSpins[_user];
    }

    function getSpinsForBadge(uint256 rarity) public pure returns (uint256) {
        if (rarity == 0) return 2;
        //bronze
        else if (rarity == 1) return 5;
        //silver
        else if (rarity == 2) return 10;
        //gold
        else if (rarity == 3) return 50;
        //godlike
        else return 0;
    }
}
