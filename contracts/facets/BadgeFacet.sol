// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../libraries/LibDiamond.sol";

contract BadgeFacet is ERC1155, Modifiers {
    event BadgeAdded(uint256 indexed badgeId, uint256 rarity, uint256 gameId, string gameTitle, string title, string description);
    event BadgeUpdated(uint256 indexed badgeId, uint256 rarity, uint256 gameId, string gameTitle, string title, string description);
    event BadgeMinted(address indexed to, uint256 indexed badgeId);

    constructor() ERC1155("") {}

    function addBadge(
        uint256 _rarity,
        uint256 _gameId,
        string memory _gameTitle,
        string memory _title,
        string memory _description
    ) public onlyContractOwner returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 newBadgeId = ds.badges.length;

        ds.badges.push(LibDiamond.Badge({id: newBadgeId, rarity: _rarity, gameId: _gameId, title: _title, description: _description, earnedOn: 0}));

        emit BadgeAdded(newBadgeId, _rarity, _gameId, _gameTitle, _title, _description);
        return newBadgeId;
    }

    function updateBadge(
        uint256 _badgeId,
        uint256 _rarity,
        uint256 _gameId,
        string memory _gameTitle,
        string memory _title,
        string memory _description
    ) public onlyContractOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(_badgeId >= 0 && _badgeId < ds.badges.length, "Badge does not exist");

        LibDiamond.Badge storage badge = ds.badges[_badgeId];
        badge.rarity = _rarity;
        badge.gameId = _gameId;
        badge.title = _title;
        badge.description = _description;

        emit BadgeUpdated(_badgeId, _rarity, _gameId, _gameTitle, _title, _description);
    }

    function batchAddBadges(
        uint256[] memory _rarities,
        uint256[] memory _gameIds,
        string[] memory _gameTitles,
        string[] memory _titles,
        string[] memory _descriptions
    ) external onlyContractOwner returns (uint256[] memory) {
        require(
            _rarities.length == _gameIds.length &&
                _gameIds.length == _gameTitles.length &&
                _gameTitles.length == _titles.length &&
                _titles.length == _descriptions.length,
            "Input arrays must have the same length"
        );

        uint256[] memory newBadgeIds = new uint256[](_rarities.length);

        for (uint256 i = 0; i < _rarities.length; i++) {
            newBadgeIds[i] = addBadge(_rarities[i], _gameIds[i], _gameTitles[i], _titles[i], _descriptions[i]);
        }

        return newBadgeIds;
    }

    function batchUpdateBadges(
        uint256[] memory _badgeIds,
        uint256[] memory _rarities,
        uint256[] memory _gameIds,
        string[] memory _gameTitles,
        string[] memory _titles,
        string[] memory _descriptions
    ) external onlyContractOwner {
        require(
            _badgeIds.length == _rarities.length &&
                _rarities.length == _gameIds.length &&
                _gameIds.length == _gameTitles.length &&
                _gameTitles.length == _titles.length &&
                _titles.length == _descriptions.length,
            "Input arrays must have the same length"
        );

        for (uint256 i = 0; i < _badgeIds.length; i++) {
            updateBadge(_badgeIds[i], _rarities[i], _gameIds[i], _gameTitles[i], _titles[i], _descriptions[i]);
        }
    }

    function mintBadge(address _to, uint256 _badgeId) public onlyContractOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(_badgeId >= 0 && _badgeId < ds.badges.length, "Badge does not exist");
        require(balanceOf(_to, _badgeId) == 0, "User already owns this badge");

        LibDiamond.Badge storage badge = ds.badges[_badgeId];
        uint256 points;

        if (badge.rarity == 0) points = 5;
        else if (badge.rarity == 1) points = 10;
        else if (badge.rarity == 2) points = 20;
        else if (badge.rarity == 3) points = 100;

        ds.userToPoints[_to] += points;
        badge.earnedOn = block.timestamp;

        _mint(_to, _badgeId, 1, "");
        emit BadgeMinted(_to, _badgeId);
    }

    function batchMintBadges(address[] calldata _to, uint256[] calldata _badgeIds) external onlyContractOwner {
        require(_to.length == _badgeIds.length, "Input arrays must have the same length");

        for (uint256 i = 0; i < _to.length; i++) {
            mintBadge(_to[i], _badgeIds[i]);
        }
    }

    function adminTransferBadges(address _from, address _to, uint256[] calldata _badgeIds) external onlyContractOwner {
        for (uint256 i = 0; i < _badgeIds.length; i++) {
            require(balanceOf(_from, _badgeIds[i]) > 0, "Sender does not own this badge");
            _safeTransferFrom(_from, _to, _badgeIds[i], 1, "");
        }
    }

    function getBadges(uint256[] memory _badgeIds) external view returns (LibDiamond.Badge[] memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (_badgeIds.length == 0) {
            return ds.badges;
        }

        LibDiamond.Badge[] memory requestedBadges = new LibDiamond.Badge[](_badgeIds.length);

        for (uint256 i = 0; i < _badgeIds.length; i++) {
            require(_badgeIds[i] >= 0 && _badgeIds[i] < ds.badges.length, "Badge does not exist");
            requestedBadges[i] = ds.badges[_badgeIds[i]];
        }

        return requestedBadges;
    }
}
