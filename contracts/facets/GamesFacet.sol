// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "../libraries/LibDiamond.sol";

contract GamesFacet {
    event GameRegistered(uint256 indexed gameId, string title, string publisher);
    event GameUpdated(uint256 indexed gameId, string title, string publisher);

    function registerGame(string memory gameTitle, string memory gameDescription, string memory publisher) external {
        require(bytes(gameTitle).length > 0, "Game title cannot be empty");
        LibDiamond.enforceIsContractOwner();

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.Game[] storage games = ds.games;

        uint256 gameId = games.length;
        games.push(LibDiamond.Game({gameId: gameId, gameTitle: gameTitle, gameDescription: gameDescription, lastUpdated: block.timestamp}));
        ds.idToGame[gameId] = games[gameId];

        emit GameRegistered(gameId, gameTitle, publisher);
    }

    function updateGame(uint256 _gameId, string memory _gameTitle, string memory _gameDescription, string memory _publisher) external {
        LibDiamond.enforceIsContractOwner();

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.Game[] storage games = ds.games;

        require(_gameId < games.length, "Game does not exist");

        LibDiamond.Game storage game = games[_gameId];
        game.gameTitle = _gameTitle;
        game.gameDescription = _gameDescription;

        ds.idToGame[_gameId] = game;

        emit GameUpdated(_gameId, _gameTitle, _publisher);
    }

    function getGames(uint256[] calldata _gameIds) external view returns (LibDiamond.Game[] memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.Game[] storage games = ds.games;

        if (_gameIds.length == 0) {
            return games;
        }

        LibDiamond.Game[] memory selectedGames = new LibDiamond.Game[](_gameIds.length);
        for (uint256 i = 0; i < _gameIds.length; i++) {
            require(_gameIds[i] < games.length, "Game does not exist");
            selectedGames[i] = games[_gameIds[i]];
        }
        return selectedGames;
    }

    function getGame(uint256 _gameId) external view returns (LibDiamond.Game memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.idToGame[_gameId];
    }

    function getGameCount() external view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.games.length;
    }
}
