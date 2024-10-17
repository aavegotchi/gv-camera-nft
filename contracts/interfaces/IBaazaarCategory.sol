// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBaazaarCategory {
    /// @notice Returns the proper baazaar category for the contract
    /// @param _tokenId The tokenId of the NFT
    /// @dev Interface ID is 0x14f337dc
    /// @return The baazaar category for the contract in reverse url format. Example: "gotchiverse.photos"
    function baazaarCategory(uint256 _tokenId) external view returns (string memory);
}
