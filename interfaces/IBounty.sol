// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IBounty {

    function init(
        string memory bounties_metadata_uri_,
        address participations_,
        address claimer_
    ) external ;

    function createBounty(
        uint256 bounty_id_,
        address reward_token_,
        uint256 reward_id_
    ) external;

    function getReward(uint256 rewards_id_)
        external
        view
        returns (address, uint256);

    function getPendingBounties() external view returns (uint256[] memory);

    function getParticipationMetadataURI()
        external
        view
        returns (string memory);

    function participate(uint256 bounty_id_, uint256 participation_id_)
        external;

    function participateMulti(
        uint256 bounty_id_,
        uint256 participation_id_,
        address[] calldata contributors_,
        uint256[] calldata dispatch_
    ) external;

    function listParticipations(uint256 bounty_id_)
        external
        view
        returns (uint256[] memory);

    function approveParticipation(uint256 bounty_id_, uint256 participation_id_)
        external;

    function claim(uint256 participation_id_) external;
}
