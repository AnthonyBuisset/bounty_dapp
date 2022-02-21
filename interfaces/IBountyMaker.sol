// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IBountyMaker {
    function createBountyRepository(
        string memory bounties_metadata_uri_,
        string memory participation_metadata_uri_
    ) external;

    function listAllRepositories() external returns (address[] memory);

    function createBountyWithERC20Rewards(
        address repository,
        uint256 bounty_id,
        address rewards_token,
        uint256 rewards_value
    ) external;

    function createBountyWithERC721Rewards(
        address repository,
        uint256 bounty_id,
        address rewards_token,
        uint256 rewards_id
    ) external;
}
