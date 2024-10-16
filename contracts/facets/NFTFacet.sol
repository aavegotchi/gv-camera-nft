// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStorage, Modifiers} from "../libraries/LibAppStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTFacet is ERC721, Modifiers {
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

    constructor() ERC721("Photo", "PHOTO") {}

    function mintPhotoToOwner(
        address _to,
        string memory _category, //gotchiverse
        string memory _collectionName, //photos
        string memory _seriesName, //launch day
        string memory _photoId, //0001-xxxx
        string memory _photographer, //current user profile displayName
        string memory _imageUrl,
        address _photographerAddress
    ) public onlyMinterOrContractOwner returns (uint256) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        uint256 newId = ds.photos.length;

        ds.photos.push(
            LibAppStorage.Photo({
                tokenId: newId,
                owner: _to,
                category: _category,
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

        emit PhotoMinted(
            _to,
            newId,
            _category,
            _collectionName,
            _seriesName,
            _photoId,
            _photographer,
            _photographerAddress,
            _imageUrl
        );
        return newId;
    }

    function batchMintPhotos(
        address[] memory _tos,
        string[] memory _categories,
        string[] memory _collectionNames,
        string[] memory _seriesNames,
        string[] memory _photoIds,
        string[] memory _photographers,
        address[] memory _photographerAddresses,
        string[] memory _imageUrls
    ) external onlyMinterOrContractOwner {
        require(
            _categories.length == _collectionNames.length &&
                _collectionNames.length == _seriesNames.length &&
                _seriesNames.length == _photoIds.length &&
                _photoIds.length == _photographers.length &&
                _photographers.length == _imageUrls.length,
            "Input arrays must have the same length"
        );

        for (uint256 i = 0; i < _tos.length; i++) {
            mintPhotoToOwner(
                _tos[i],
                _categories[i],
                _collectionNames[i],
                _seriesNames[i],
                _photoIds[i],
                _photographers[i],
                _imageUrls[i],
                _photographerAddresses[i]
            );
        }
    }

    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external view returns (address receiver, uint256 royaltyAmount) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();

        return (
            ds.photos[_tokenId].photographerAddress,
            (_salePrice * ds.royaltyPercentage) / 100
        );
    }

    function getPhotos(
        uint256[] memory _photoIds
    ) external view returns (LibAppStorage.Photo[] memory) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();

        if (_photoIds.length == 0) {
            return ds.photos;
        }

        LibAppStorage.Photo[]
            memory requestedPhotos = new LibAppStorage.Photo[](
                _photoIds.length
            );

        for (uint256 i = 0; i < _photoIds.length; i++) {
            require(
                _photoIds[i] >= 0 && _photoIds[i] < ds.photos.length,
                "Photo does not exist"
            );
            requestedPhotos[i] = ds.photos[_photoIds[i]];
        }

        return requestedPhotos;
    }

    function getPhotosLength() external view returns (uint256) {
        return LibAppStorage.diamondStorage().photos.length;
    }

    // Add this new function to generate the token URI
    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        require(_tokenId < ds.photos.length, "Photo does not exist");

        LibAppStorage.Photo memory photo = ds.photos[_tokenId];

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                photo.category,
                                '", "description":"',
                                photo.collectionName,
                                '", "attributes": [{"trait_type": "Series Name", "value": "',
                                photo.seriesName,
                                '"}], "id":"',
                                Strings.toString(_tokenId),
                                '", "image":"',
                                //aws url
                                string(
                                    abi.encodePacked(
                                        "https://arweave.net/",
                                        photo.imageUrl
                                    )
                                ),
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    // function burn(
    //     address account,
    //     uint256 id,
    //     uint256 value
    // ) public virtual override onlyAGCAdminOrContractOwner {
    //     require(value == 1, "Can only burn one badge at a time");
    //     _burn(account, id, 1);

    //     LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
    //     LibAppStorage.Badge storage badge = ds.badges[id];
    //     uint256 points = getPointsForRarity(badge.rarity);
    //     ds.userToAGCPoints[account] -= points;
    //     badge.count -= 1; // Decrement the count by 1 when burning
    // }

    // function burnBatch(
    //     address account,
    //     uint256[] memory ids,
    //     uint256[] memory values
    // ) public virtual override onlyAGCAdminOrContractOwner {
    //     _burnBatch(account, ids, values);

    //     LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
    //     for (uint256 i = 0; i < ids.length; i++) {
    //         require(values[i] == 1, "Can only burn one badge at a time");
    //         LibAppStorage.Badge storage badge = ds.badges[ids[i]];
    //         uint256 points = getPointsForRarity(badge.rarity);
    //         ds.userToAGCPoints[account] -= points * values[i];
    //         badge.count -= values[i]; // Decrement the count when burning
    //     }
    // }
}
