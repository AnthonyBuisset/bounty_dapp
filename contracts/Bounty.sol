// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IBounty.sol";
import "../interfaces/IBountyReward.sol";
import "../interfaces/IBountyRewardsClaimer.sol";
import "../libraries/Array.sol";
import "./BountyParticipation.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

contract Bounty is IBounty, ERC1155, IERC1155Receiver {
    using Array for uint256[];
    
    uint256[] private _bounties;
    address private _participations;
    address private _claimer;
    mapping(uint256 => uint256[]) _bounties_participations;

    struct Reward {
        address token;
        uint256 id;
    }

    enum Status {
        NONE,
        PENDING,
        FULFILLED
    }

    mapping(uint256 => Reward) private _rewards;
    mapping(uint256 => Status) private _statuses;

    constructor(
        string memory bounties_metadata_uri_,
        address participations_,
        address claimer_
    ) ERC1155(bounties_metadata_uri_) {
        _participations = participations_;
        _claimer = claimer_;

        IERC1155(_participations).setApprovalForAll(_claimer, true);
    }

    function createBounty(
        uint256 bounty_id_,
        address reward_token_,
        uint256 reward_id_
    ) external virtual override {
        require(
            _statuses[bounty_id_] == Status.NONE,
            "Bounty: Bounty already published"
        );
        _statuses[bounty_id_] = Status.PENDING;
        _bounties.push(bounty_id_);
        _rewards[bounty_id_] = Reward(reward_token_, reward_id_);
        IERC1155(reward_token_).safeTransferFrom(
            _msgSender(),
            address(this),
            reward_id_,
            1,
            ""
        );
    }

    function getReward(uint256 bounty_id_)
        external
        view
        virtual
        override
        returns (address, uint256)
    {
        Reward memory reward = _rewards[bounty_id_];
        return (reward.token, reward.id);
    }

    function getPendingBounties()
        external
        view
        virtual
        override
        returns (uint256[] memory)
    {
        uint256 nb_bounties = 0;
        for (uint256 i = 0; i < _bounties.length; ++i) {
            if (_statuses[_bounties[i]] == Status.PENDING) {
                ++nb_bounties;
            }
        }

        uint256[] memory pending_bounties = new uint256[](nb_bounties);
        uint256 current = 0;
        for (uint256 i = 0; i < _bounties.length; ++i) {
            if (_statuses[_bounties[i]] == Status.PENDING) {
                pending_bounties[current] = _bounties[i];
                ++current;
            }
        }

        return pending_bounties;
    }

    function getParticipationMetadataURI()
        external
        view
        virtual
        override
        returns (string memory)
    {
        return IERC1155MetadataURI(_participations).uri(0);
    }

    function onERC1155Received(
        address operator,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external virtual override returns (bytes4) {
        require(
            operator == address(this),
            "Bounty: Can only receive ERC1155 when initiated from this"
        );
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external virtual override returns (bytes4) {
        return 0;
    }

    function participate(uint256 bounty_id_, uint256 participation_id_)
        external
        virtual
        override
    {
        address[] memory contributors = new address[](1);
        uint256[] memory dispatch = new uint256[](1);
        contributors[0] = _msgSender();

        Reward memory reward = _rewards[bounty_id_];
        dispatch[0] = IBountyReward(reward.token).supply(reward.id);

        _participate(bounty_id_, participation_id_, contributors, dispatch);
    }

    function participateMulti(
        uint256 bounty_id_,
        uint256 participation_id_,
        address[] memory contributors_,
        uint256[] memory dispatch_
    ) external virtual override {
        _participate(bounty_id_, participation_id_, contributors_, dispatch_);
    }

    function _participate(
        uint256 bounty_id_,
        uint256 participation_id_,
        address[] memory contributors_,
        uint256[] memory dispatch_
    ) internal {
        Reward memory reward = _rewards[bounty_id_];
        require(dispatch_.sum() == IBountyReward(reward.token).supply(reward.id), "Bounty: Invalid rewards dispatch");

        _bounties_participations[bounty_id_].push(participation_id_);
        IBountyParticipation(_participations).create(
            participation_id_,
            contributors_,
            dispatch_
        );
    }

    function listParticipations(uint256 bounty_id_)
        external
        view
        virtual
        override
        returns (uint256[] memory)
    {
        return _bounties_participations[bounty_id_];
    }

    function approveParticipation(uint256 bounty_id_, uint256 participation_id_)
        external
        virtual
        override
    {
        _statuses[bounty_id_] = Status.FULFILLED;
        IBountyParticipation(_participations).approve(participation_id_);

        Reward memory reward = _rewards[bounty_id_];
        IBountyRewardsClaimer(_claimer).unlockReward(
            reward.token,
            reward.id,
            participation_id_
        );
    }

    function claim(uint256 participation_id_) external virtual override {
        uint256 amount = IERC1155(_participations).balanceOf(_msgSender(), participation_id_);
        IERC1155(_participations).safeTransferFrom(_msgSender(), address(this), participation_id_, amount, "");
        IBountyRewardsClaimer(_claimer).claim(participation_id_, _msgSender());
    }
}
