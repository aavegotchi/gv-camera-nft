// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStoragePostcard, Modifiers} from "../../libraries/LibAppStoragePostcard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PostcardFacet is ERC1155, Modifiers {
    event AddPostCard(
        string postcardId,
        string category,
        string collectionName,
        string postcardName,
        string postcardDescription,
        string postcardImageUrl
    );

    event PostcardMinted(address indexed owner, uint256 seriesNumber, uint256 quantity);

    constructor() ERC1155("") {}

    function adminAddPostcard(
        string memory _category,
        string memory _collectionName,
        string memory _seriesName,
        string memory _description,
        string memory _imageUrl
    ) external onlyContractOwner {
        LibAppStoragePostcard.AppStorage storage ds = LibAppStoragePostcard.diamondStorage();
        uint256 newId = ds.postcards.length;

        ds.postcards.push(
            LibAppStoragePostcard.Postcard({
                category: _category,
                collectionName: _collectionName,
                seriesName: _seriesName,
                seriesNumber: newId,
                description: _description,
                imageUrl: _imageUrl,
                mintedOn: block.timestamp
            })
        );
    }

    function mintPostcardToOwner(
        address _to,
        uint256 _seriesNumber //1
    ) public onlyMinterOrContractOwner {
        _mint(_to, _seriesNumber, 1, "");
        emit PostcardMinted(_to, _seriesNumber, 1);
    }

    function batchMintPostcards(address[] memory _tos, uint256[] memory _seriesNumbers) external onlyMinterOrContractOwner {
        require(_seriesNumbers.length == _tos.length, "Input arrays must have the same length");

        for (uint256 i = 0; i < _tos.length; i++) {
            mintPostcardToOwner(_tos[i], _seriesNumbers[i]);
        }
    }

    function getPostcards(uint256[] memory _postcardIds) external view returns (LibAppStoragePostcard.Postcard[] memory) {
        LibAppStoragePostcard.AppStorage storage ds = LibAppStoragePostcard.diamondStorage();

        if (_postcardIds.length == 0) {
            return ds.postcards;
        }

        LibAppStoragePostcard.Postcard[] memory requestedPostcards = new LibAppStoragePostcard.Postcard[](_postcardIds.length);

        for (uint256 i = 0; i < _postcardIds.length; i++) {
            require(_postcardIds[i] >= 0 && _postcardIds[i] < ds.postcards.length, "Postcard does not exist");
            requestedPostcards[i] = ds.postcards[_postcardIds[i]];
        }

        return requestedPostcards;
    }

    function getPostcardsLength() external view returns (uint256) {
        return LibAppStoragePostcard.diamondStorage().postcards.length;
    }

    // Add this new function to generate the token URI
    function uri(uint256 _tokenId) public view override returns (string memory) {
        LibAppStoragePostcard.AppStorage storage ds = LibAppStoragePostcard.diamondStorage();
        require(_tokenId < ds.postcards.length, "Postcard does not exist");

        LibAppStoragePostcard.Postcard memory postcard = ds.postcards[_tokenId];

        string memory json = _generateJsonString(postcard, _tokenId);
        bytes memory encodedJson = bytes(json);
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(encodedJson)));
    }

    function _generateJsonString(LibAppStoragePostcard.Postcard memory postcard, uint256 _tokenId) private pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '{"name":"',
                    postcard.category,
                    '", "description":"',
                    postcard.collectionName,
                    '", "attributes": [',
                    _generateAttributes(postcard),
                    '], "id":"',
                    Strings.toString(_tokenId),
                    '", "image":"https://arweave.net/',
                    postcard.imageUrl,
                    '"}'
                )
            );
    }

    function _generateAttributes(LibAppStoragePostcard.Postcard memory postcard) private pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '{"trait_type": "Series Name", "value": "',
                    postcard.seriesName,
                    '"}, ',
                    '{"trait_type": "Minted On", "value": "',
                    Strings.toString(postcard.mintedOn),
                    '"}'
                )
            );
    }
}
