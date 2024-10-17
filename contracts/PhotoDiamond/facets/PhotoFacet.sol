// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStoragePhoto, Modifiers} from "../../libraries/LibAppStoragePhoto.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {IBaazaarCategory} from "../../interfaces/IBaazaarCategory.sol";

contract PhotoFacet is ERC721Upgradeable, Modifiers, IBaazaarCategory {
    event PhotoMinted(
        address indexed owner,
        uint256 indexed tokenId,
        string category,
        string collectionName,
        string seriesName,
        string photoId,
        string photographer,
        address photographerAddress,
        string imageUrl
    );

    //ERC721 OZ impl
    bytes32 private constant ERC721StorageLocation = 0x80bb2b638cc20bc4d0a60d66940f3ab4a00c1d7b313497ca82fb0b4ab0079300;
    constructor() {
        ERC721Storage storage $;
        assembly {
            $.slot := ERC721StorageLocation
        }
        $._name = "Gotchiverse Photos";
        $._symbol = "GVP";
    }

    function name() public pure override returns (string memory) {
        return "Gotchiverse Photos";
    }

    function symbol() public pure override returns (string memory) {
        return "GVP";
    }

    function baazaarCategory(uint256 _tokenId) external pure returns (string memory) {
        return "gotchiverse.photos";
    }

    function mintPhotoToOwner(
        address _to,
        string memory _collectionName, //photos
        string memory _seriesName, //launch day
        string memory _photoId, //0001-xxxx
        string memory _photographer, //current user profile displayName
        string memory _imageUrl,
        address _photographerAddress
    ) public onlyMinterOrContractOwner returns (uint256) {
        LibAppStoragePhoto.AppStorage storage ds = LibAppStoragePhoto.diamondStorage();
        uint256 newId = ds.photos.length;

        ds.photos.push(
            LibAppStoragePhoto.Photo({
                tokenId: newId,
                owner: _to,
                category: "gotchiverse",
                collectionName: _collectionName,
                seriesName: _seriesName,
                photoId: _photoId,
                photographer: _photographer,
                photographerAddress: _photographerAddress,
                mintedOn: block.timestamp,
                imageUrl: _imageUrl
            })
        );

        _mint(_to, newId);

        emit PhotoMinted(_to, newId, "gotchiverse", _collectionName, _seriesName, _photoId, _photographer, _photographerAddress, _imageUrl);
        return newId;
    }

    function batchMintPhotos(
        address[] memory _tos,
        string[] memory _collectionNames,
        string[] memory _seriesNames,
        string[] memory _photoIds,
        string[] memory _photographers,
        address[] memory _photographerAddresses,
        string[] memory _imageUrls
    ) external onlyMinterOrContractOwner {
        require(
            _collectionNames.length == _seriesNames.length &&
                _seriesNames.length == _photoIds.length &&
                _photoIds.length == _photographers.length &&
                _photographers.length == _imageUrls.length,
            "Input arrays must have the same length"
        );

        for (uint256 i = 0; i < _tos.length; i++) {
            mintPhotoToOwner(
                _tos[i],
                _collectionNames[i],
                _seriesNames[i],
                _photoIds[i],
                _photographers[i],
                _imageUrls[i],
                _photographerAddresses[i]
            );
        }
    }

    function getPhotos(uint256[] memory _photoIds) external view returns (LibAppStoragePhoto.Photo[] memory) {
        LibAppStoragePhoto.AppStorage storage ds = LibAppStoragePhoto.diamondStorage();

        if (_photoIds.length == 0) {
            return ds.photos;
        }

        LibAppStoragePhoto.Photo[] memory requestedPhotos = new LibAppStoragePhoto.Photo[](_photoIds.length);

        for (uint256 i = 0; i < _photoIds.length; i++) {
            require(_photoIds[i] >= 0 && _photoIds[i] < ds.photos.length, "Photo does not exist");
            requestedPhotos[i] = ds.photos[_photoIds[i]];
        }

        return requestedPhotos;
    }

    function getPhotosLength() external view returns (uint256) {
        return LibAppStoragePhoto.diamondStorage().photos.length;
    }

    // Add this new function to generate the token URI
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        LibAppStoragePhoto.AppStorage storage ds = LibAppStoragePhoto.diamondStorage();
        require(_tokenId < ds.photos.length, "Photo does not exist");

        LibAppStoragePhoto.Photo memory photo = ds.photos[_tokenId];

        string memory json = _generateJsonString(photo, _tokenId);
        bytes memory encodedJson = bytes(json);
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(encodedJson)));
    }

    function _generateJsonString(LibAppStoragePhoto.Photo memory photo, uint256 _tokenId) private pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '{"name":"',
                    photo.category,
                    '", "description":"',
                    photo.collectionName,
                    '", "attributes": [',
                    _generateAttributes(photo),
                    '], "id":"',
                    Strings.toString(_tokenId),
                    '", "image":"https://arweave.net/',
                    photo.imageUrl,
                    '"}'
                )
            );
    }

    function _generateAttributes(LibAppStoragePhoto.Photo memory photo) private pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '{"trait_type": "Series Name", "value": "',
                    photo.seriesName,
                    '"}, ',
                    '{"trait_type": "Photographer", "value": "',
                    photo.photographer,
                    '"}, ',
                    '{"trait_type": "Photo ID", "value": "',
                    photo.photoId,
                    '"}, ',
                    '{"trait_type": "Minted On", "value": "',
                    Strings.toString(photo.mintedOn),
                    '"}'
                )
            );
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        LibAppStoragePhoto.AppStorage storage ds = LibAppStoragePhoto.diamondStorage();

        return (ds.photos[_tokenId].photographerAddress, (_salePrice * ds.royaltyPercentage) / 10000);
    }
}
