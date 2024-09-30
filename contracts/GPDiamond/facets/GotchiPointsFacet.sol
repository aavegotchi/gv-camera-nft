// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {LibAppStorageGP, Modifiers} from "../../libraries/LibAppStorageGP.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {LibGotchiPoints} from "../../libraries/LibGotchiPoints.sol";

contract GotchiPointsFacet is Modifiers {
    event PointsMinted(address indexed to, uint256 indexed season, uint256 amount);
    event ConversionRateAdjusted(address indexed token, uint256 rate);
    event SeasonMaxPointsSet(uint256 season, uint256 maxPoints);
    event SeasonIncremented(uint256 season);

    function convertAlchemica(address _recipient, uint256 _fud, uint256 _fomo, uint256 _alpha, uint256 _kek) external {
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();

        // Burn Alchemica tokens from the sender

        //todo: check that the existing Alchemica can support this function
        ERC20Burnable(s.fudContract).burnFrom(msg.sender, _fud);
        ERC20Burnable(s.fomoContract).burnFrom(msg.sender, _fomo);
        ERC20Burnable(s.alphaContract).burnFrom(msg.sender, _alpha);
        ERC20Burnable(s.kekContract).burnFrom(msg.sender, _kek);

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
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();
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
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();
        s.currentSeason++;
        emit SeasonIncremented(s.currentSeason);
    }

    function setSeasonTotals(uint256 _season, uint256 _totalPoints) external onlyContractOwner {
        //sets the total number of points available in a Season.
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();
        s.seasonToMaxPoints[_season] = _totalPoints;

        emit SeasonMaxPointsSet(_season, _totalPoints);
    }

    //view functions

    function currentSeason() external view returns (uint256) {
        return LibAppStorageGP.diamondStorage().currentSeason;
    }
    function getUserPoints(address _user) external view returns (uint256) {
        return LibAppStorageGP.diamondStorage().userToPoints[_user];
    }
    function getSeasonPoints(uint256 _season) external view returns (uint256) {
        return LibAppStorageGP.diamondStorage().seasonPoints[_season];
    }

    function getSeasonMaxPoints(uint256 _season) external view returns (uint256) {
        return LibAppStorageGP.diamondStorage().seasonToMaxPoints[_season];
    }

    function fudContract() external view returns (address) {
        return LibAppStorageGP.diamondStorage().fudContract;
    }
    function fomoContract() external view returns (address) {
        return LibAppStorageGP.diamondStorage().fomoContract;
    }
    function alphaContract() external view returns (address) {
        return LibAppStorageGP.diamondStorage().alphaContract;
    }
    function kekContract() external view returns (address) {
        return LibAppStorageGP.diamondStorage().kekContract;
    }

    function conversionRate(address _tokenAddress) public view returns (uint256) {
        LibAppStorageGP.AppStorageGP storage s = LibAppStorageGP.diamondStorage();
        return s.tokenToConversionRate[_tokenAddress];
    }
}
