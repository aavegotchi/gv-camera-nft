// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";
import {LibAppStorage} from "./libraries/LibAppStorage.sol";

contract AGCDiamond {
    constructor(
        address _contractOwner,
        address _diamondCutFacet,
        address[] memory _agcAdmins,
        address _fud,
        address _fomo,
        address _alpha,
        address _kek,
        uint256 initialSeasonMaxPoints,
        uint256[] memory _defaultWheelWeights,
        uint256[] memory _defaultWheelPoints,
        //initial conversion rates
        uint256[] memory _tokenConversonRates //fud, fomo, alpha, kek
    ) payable {
        LibDiamond.setContractOwner(_contractOwner);

        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        cut[0] = IDiamondCut.FacetCut({facetAddress: _diamondCutFacet, action: IDiamondCut.FacetCutAction.Add, functionSelectors: functionSelectors});
        LibDiamond.diamondCut(cut, address(0), "");

        //set first agc admin
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();

        for (uint256 i = 0; i < _agcAdmins.length; i++) {
            ds.agcAdmins[_agcAdmins[i]] = true;
        }

        //GOTCHI Points
        //set the alchemica addresses

        ds.fudContract = _fud;
        ds.fomoContract = _fomo;
        ds.alphaContract = _alpha;
        ds.kekContract = _kek;

        //Set the initial season pointd
        ds.seasonToMaxPoints[0] = initialSeasonMaxPoints;

        //Set the default wheel weights and points
        ds.wheelWeights = _defaultWheelWeights;
        ds.wheelPoints = _defaultWheelPoints;

        ds.tokenToConversionRate[_fud] = _tokenConversonRates[0];
        ds.tokenToConversionRate[_fomo] = _tokenConversonRates[1];
        ds.tokenToConversionRate[_alpha] = _tokenConversonRates[2];
        ds.tokenToConversionRate[_kek] = _tokenConversonRates[3];
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        // get diamond storage
        assembly {
            ds.slot := position
        }
        // get facet from function selector
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");
        // Execute external function from facet using delegatecall and return any value.
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}
