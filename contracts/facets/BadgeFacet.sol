// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {LibAppStorage, Modifiers} from "../libraries/LibAppStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {WheelFacet} from "./WheelFacet.sol";
import {LibGotchiPoints} from "../libraries/LibGotchiPoints.sol";
import {LibAGCPoints} from "../libraries/LibAGCPoints.sol";

contract BadgeFacet is ERC1155, ERC1155Burnable, Modifiers {
    event BadgeAdded(
        uint256 indexed id,
        string badgeId,
        uint256 rarity,
        uint256 gameId,
        string gameTitle,
        string title,
        string description,
        string imageUrl
    );
    event BadgeUpdated(
        uint256 id,
        string badgeId,
        uint256 rarity,
        uint256 gameId,
        string gameTitle,
        string title,
        string description,
        string imageUrl
    );
    event BadgeMinted(address indexed to, uint256 indexed badgeId);
    event URISet(string newuri);

    error NonTransferableToken();

    constructor() ERC1155("") {}

    // Override and disable transfer functions
    function safeTransferFrom(address, address, uint256, uint256, bytes memory) public virtual override {
        revert NonTransferableToken();
    }

    function safeBatchTransferFrom(address, address, uint256[] memory, uint256[] memory, bytes memory) public virtual override {
        revert NonTransferableToken();
    }

    function addBadge(
        uint256 _rarity,
        string memory _badgeId, //ABC123 ID
        uint256 _gameId,
        string memory _gameTitle,
        string memory _title,
        string memory _description,
        string memory _imageUrl
    ) public onlyAGCAdminOrContractOwner returns (uint256) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        uint256 newId = ds.badges.length;

        ds.badges.push(
            //change numeric badgegid to id and uid to badgeId
            LibAppStorage.Badge({
                id: newId,
                rarity: _rarity,
                badgeId: _badgeId,
                gameId: _gameId,
                title: _title,
                description: _description,
                earnedOn: 0,
                count: 0, // Initialize count to 0
                imageUrl: _imageUrl
            })
        );

        //ABC123 ID
        emit BadgeAdded(newId, _badgeId, _rarity, _gameId, _gameTitle, _title, _description, _imageUrl);
        return newId;
    }

    function updateBadge(
        uint256 _id,
        string memory _badgeId,
        uint256 _rarity,
        uint256 _gameId,
        string memory _gameTitle,
        string memory _title,
        string memory _description,
        string memory _imageUrl
    ) public onlyAGCAdminOrContractOwner {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        require(_id >= 0 && _id < ds.badges.length, "Badge does not exist");

        LibAppStorage.Badge storage badge = ds.badges[_id];
        badge.rarity = _rarity;
        badge.gameId = _gameId;
        badge.title = _title;
        badge.description = _description;
        badge.imageUrl = _imageUrl;
        emit BadgeUpdated(_id, _badgeId, _rarity, _gameId, _gameTitle, _title, _description, _imageUrl);
    }

    function batchAddBadges(
        uint256[] memory _rarities,
        string[] memory _badgeIds,
        uint256[] memory _gameIds,
        string[] memory _gameTitles,
        string[] memory _titles,
        string[] memory _descriptions,
        string[] memory _imageUrls
    ) external onlyAGCAdminOrContractOwner returns (uint256[] memory) {
        require(
            _badgeIds.length == _rarities.length &&
                _rarities.length == _gameIds.length &&
                _gameIds.length == _gameTitles.length &&
                _gameTitles.length == _titles.length &&
                _titles.length == _descriptions.length &&
                _descriptions.length == _imageUrls.length,
            "Input arrays must have the same length"
        );

        uint256[] memory newBadgeIds = new uint256[](_rarities.length);

        for (uint256 i = 0; i < _rarities.length; i++) {
            newBadgeIds[i] = addBadge(_rarities[i], _badgeIds[i], _gameIds[i], _gameTitles[i], _titles[i], _descriptions[i], _imageUrls[i]);
        }

        return newBadgeIds;
    }

    function batchUpdateBadges(
        uint256[] memory _ids,
        string[] memory _badgeIds,
        uint256[] memory _rarities,
        uint256[] memory _gameIds,
        string[] memory _gameTitles,
        string[] memory _titles,
        string[] memory _descriptions,
        string[] memory _imageUrls
    ) external onlyAGCAdminOrContractOwner {
        require(
            _badgeIds.length == _rarities.length &&
                _rarities.length == _gameIds.length &&
                _gameIds.length == _gameTitles.length &&
                _gameTitles.length == _titles.length &&
                _titles.length == _descriptions.length,
            "Input arrays must have the same length"
        );

        for (uint256 i = 0; i < _badgeIds.length; i++) {
            updateBadge(_ids[i], _badgeIds[i], _rarities[i], _gameIds[i], _gameTitles[i], _titles[i], _descriptions[i], _imageUrls[i]);
        }
    }

    function mintBadge(address _to, uint256 _badgeId) public onlyAGCAdminOrContractOwner {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        require(_badgeId >= 0 && _badgeId < ds.badges.length, "Badge does not exist");
        require(balanceOf(_to, _badgeId) == 0, "User already owns this badge");

        LibAppStorage.Badge storage badge = ds.badges[_badgeId];
        uint256 points = getPointsForRarity(badge.rarity);

        LibAGCPoints._mintPoints(_to, points);

        badge.earnedOn = block.timestamp;
        badge.count++; // Increment the count when minting

        WheelFacet wheelFacet = WheelFacet(address(this));
        uint256 spinsToGrant = wheelFacet.getSpinsForBadge(badge.rarity);
        ds.userToSpins[_to] += spinsToGrant;
        emit LibGotchiPoints.SpinsGranted(_to, spinsToGrant);

        _mint(_to, _badgeId, 1, "");
        emit BadgeMinted(_to, _badgeId);
    }

    function batchMintBadges(address[] calldata _to, uint256[] calldata _badgeIds) external onlyAGCAdminOrContractOwner {
        require(_to.length == _badgeIds.length, "Input arrays must have the same length");

        for (uint256 i = 0; i < _to.length; i++) {
            mintBadge(_to[i], _badgeIds[i]);
        }
    }

    function adminTransferBadges(address _from, address _to, uint256[] calldata _badgeIds) external onlyAGCAdminOrContractOwner {
        for (uint256 i = 0; i < _badgeIds.length; i++) {
            require(balanceOf(_from, _badgeIds[i]) > 0, "Sender does not own this badge");
            _safeTransferFrom(_from, _to, _badgeIds[i], 1, "");
        }
    }

    function getBadges(uint256[] memory _badgeIds) external view returns (LibAppStorage.Badge[] memory) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();

        if (_badgeIds.length == 0) {
            return ds.badges;
        }

        LibAppStorage.Badge[] memory requestedBadges = new LibAppStorage.Badge[](_badgeIds.length);

        for (uint256 i = 0; i < _badgeIds.length; i++) {
            require(_badgeIds[i] >= 0 && _badgeIds[i] < ds.badges.length, "Badge does not exist");
            requestedBadges[i] = ds.badges[_badgeIds[i]];
        }

        return requestedBadges;
    }

    function getBadgesLength() external view returns (uint256) {
        return LibAppStorage.diamondStorage().badges.length;
    }

    // Add this new function to generate the token URI
    function uri(uint256 _tokenId) public view override returns (string memory) {
        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        require(_tokenId < ds.badges.length, "Badge does not exist");

        LibAppStorage.Badge memory badge = ds.badges[_tokenId];

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                badge.title,
                                '", "description":"',
                                badge.description,
                                '", "attributes": [{"trait_type": "Rarity", "value": "',
                                Strings.toString(badge.rarity),
                                '"}, {"trait_type": "Game ID", "value": "',
                                Strings.toString(badge.gameId),
                                '"}], "id":"',
                                Strings.toString(_tokenId),
                                '", "image":"',
                                //aws url
                                string(abi.encodePacked("https://arweave.net/", badge.imageUrl)),
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function burn(address account, uint256 id, uint256 value) public virtual override onlyAGCAdminOrContractOwner {
        require(value == 1, "Can only burn one badge at a time");
        _burn(account, id, 1);

        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        LibAppStorage.Badge storage badge = ds.badges[id];
        uint256 points = getPointsForRarity(badge.rarity);
        ds.userToAGCPoints[account] -= points;
        badge.count -= 1; // Decrement the count by 1 when burning
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public virtual override onlyAGCAdminOrContractOwner {
        _burnBatch(account, ids, values);

        LibAppStorage.AppStorage storage ds = LibAppStorage.diamondStorage();
        for (uint256 i = 0; i < ids.length; i++) {
            require(values[i] == 1, "Can only burn one badge at a time");
            LibAppStorage.Badge storage badge = ds.badges[ids[i]];
            uint256 points = getPointsForRarity(badge.rarity);
            ds.userToAGCPoints[account] -= points * values[i];
            badge.count -= values[i]; // Decrement the count when burning
        }
    }

    // Helper function to get points for a rarity level
    function getPointsForRarity(uint256 rarity) public pure returns (uint256) {
        if (rarity == 0) return 5;
        else if (rarity == 1) return 10;
        else if (rarity == 2) return 20;
        else if (rarity == 3) return 100;
        else return 0;
    }

    function getUserAGCPoints(address user) external view returns (uint256) {
        return LibAppStorage.diamondStorage().userToAGCPoints[user];
    }
}
