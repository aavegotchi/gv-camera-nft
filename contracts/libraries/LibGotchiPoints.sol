// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibAppStorageGP} from "./LibAppStorageGP.sol";
import "hardhat/console.sol";

library LibGotchiPoints {
    event WheelSpinResult(address indexed user, uint256 pointsWon);

    function _grantPoints(address[] memory _recipients, uint256[] memory _amounts) internal {
        //Adds GOTCHI points to the recipient. Only callable by the convert functions above, and the `spinWheel` function in WheelFacet.

        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();
        uint256 season = s.currentSeason;

        for (uint256 i = 0; i < _recipients.length; i++) {
            s.userToPoints[_recipients[i]] += _amounts[i];
            s.seasonPoints[season] += _amounts[i];
        }

        //check if season points is greater than season max points
        if (s.seasonPoints[season] > s.seasonToMaxPoints[season]) {
            revert("Exceeds season max points");
        }
    }

    function _spinWheel(bool useSpins) internal {
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();

        require(s.wheelPoints.length > 0 && s.wheelWeights.length > 0, "LibGotchiPoints: Wheel not configured");

        if (useSpins) {
            require(s.userToSpins[msg.sender] > 0, "LibGotchiPoints: No spins remaining");
            s.userToSpins[msg.sender]--;
        }

        // Calculate total weight and log individual weights
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < s.wheelWeights.length; i++) {
            totalWeight += s.wheelWeights[i];
            require(s.wheelWeights[i] > 0, "LibGotchiPoints: Invalid wheel weight");
        }
        require(totalWeight > 0, "LibGotchiPoints: Total weight must be greater than 0");

        // Get a random number and scale it to the total weight
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number))) % totalWeight;
        randomNumber = randomNumber + 1; // Ensure it's never 0

        // Find the corresponding wheel segment
        uint256 cumulativeWeight = 0;
        uint256 selectedIndex = s.wheelWeights.length - 1; // Default to last index
        for (uint256 i = 0; i < s.wheelWeights.length; i++) {
            cumulativeWeight += s.wheelWeights[i];

            if (randomNumber <= cumulativeWeight) {
                selectedIndex = i;
                break;
            }
        }

        // Get the points for the selected segment
        uint256 pointsWon = s.wheelPoints[selectedIndex];

        // Grant points to the recipient using arrays
        address[] memory recipients = new address[](1);
        recipients[0] = msg.sender;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = pointsWon;

        LibGotchiPoints._grantPoints(recipients, amounts);

        // Emit an event for the wheel spin result
        emit WheelSpinResult(msg.sender, pointsWon);
    }
}
