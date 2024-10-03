// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorage, Modifiers} from "../libraries/LibAppStorage.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LibGotchiPoints} from "../libraries/LibGotchiPoints.sol";

contract GotchiPointsFacet is Modifiers {
    event PointsMinted(address indexed to, uint256 indexed season, uint256 amount);
    event ConversionRateAdjusted(address indexed token, uint256 rate);
    event SeasonMaxPointsSet(uint256 season, uint256 maxPoints);
    event SeasonIncremented(uint256 season);

    function convertAlchemica(address _recipient, uint256 _fud, uint256 _fomo, uint256 _alpha, uint256 _kek) external {
        LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();

        // Burn Alchemica tokens from the sender

        address burnAddress = 0x000000000000000000000000000000000000dEaD;

        //Burn tokens by sending to burnAddress
        IERC20(s.fudContract).transferFrom(msg.sender, burnAddress, _fud);
        IERC20(s.fomoContract).transferFrom(msg.sender, burnAddress, _fomo);
        IERC20(s.alphaContract).transferFrom(msg.sender, burnAddress, _alpha);
        IERC20(s.kekContract).transferFrom(msg.sender, burnAddress, _kek);

        // Calculate points based on individual conversion rates
        uint256 totalPoints = _fud *
            conversionRate(s.fudContract) +
            _fomo *
            conversionRate(s.fomoContract) +
            _alpha *
            conversionRate(s.alphaContract) +
            _kek *
            conversionRate(s.kekContract);

        // Grant points to the recipient using arrays
        address[] memory recipients = new address[](1);
        recipients[0] = _recipient;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = totalPoints;
        LibGotchiPoints._grantPoints(recipients, amounts);

        emit PointsMinted(_recipient, s.currentSeason, totalPoints);
    }

    function convertParcels(uint256[] calldata _parcelIds, address _recipient) external {
        //Burn the user’s Parcels and adds GOTCHI points to the recipient.
        //todo
    }

    function adjustConversionRate(uint256 _fud, uint256 _fomo, uint256 _alpha, uint256 _kek) external onlyContractOwner {
        //Adjusts the conversion rates of Alchemica to Points.
        LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
        s.tokenToConversionRate[s.fudContract] = _fud;
        s.tokenToConversionRate[s.fomoContract] = _fomo;
        s.tokenToConversionRate[s.alphaContract] = _alpha;
        s.tokenToConversionRate[s.kekContract] = _kek;

        //emit events
        emit ConversionRateAdjusted(s.fudContract, _fud);
        emit ConversionRateAdjusted(s.fomoContract, _fomo);
        emit ConversionRateAdjusted(s.alphaContract, _alpha);
        emit ConversionRateAdjusted(s.kekContract, _kek);
    }

    function incrementSeason() external onlyContractOwner {
        //Increments the current season.
        LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
        s.currentSeason++;
        emit SeasonIncremented(s.currentSeason);
    }

    function setSeasonTotals(uint256 _season, uint256 _totalPoints) external onlyContractOwner {
        //sets the total number of points available in a Season.
        LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
        s.seasonToMaxPoints[_season] = _totalPoints;

        emit SeasonMaxPointsSet(_season, _totalPoints);
    }

    //view functions

    function currentSeason() external view returns (uint256) {
        return LibAppStorage.diamondStorage().currentSeason;
    }
    function getUserGotchiPoints(address _user) external view returns (uint256) {
        return LibAppStorage.diamondStorage().userToGotchiPoints[_user];
    }
    function getSeasonPoints(uint256 _season) external view returns (uint256) {
        return LibAppStorage.diamondStorage().seasonPoints[_season];
    }

    function getSeasonMaxPoints(uint256 _season) external view returns (uint256) {
        return LibAppStorage.diamondStorage().seasonToMaxPoints[_season];
    }

    function fudContract() external view returns (address) {
        return LibAppStorage.diamondStorage().fudContract;
    }
    function fomoContract() external view returns (address) {
        return LibAppStorage.diamondStorage().fomoContract;
    }
    function alphaContract() external view returns (address) {
        return LibAppStorage.diamondStorage().alphaContract;
    }
    function kekContract() external view returns (address) {
        return LibAppStorage.diamondStorage().kekContract;
    }

    function conversionRate(address _tokenAddress) public view returns (uint256) {
        LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
        return s.tokenToConversionRate[_tokenAddress];
    }
}
