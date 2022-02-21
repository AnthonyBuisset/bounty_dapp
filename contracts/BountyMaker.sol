// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IBountyMaker.sol";
import "./Bounty.sol";
import "./BountyParticipation.sol";
import "./BountyRewardsClaimer.sol";
import "./ERC20BountyReward.sol";
import "./ERC721BountyReward.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract BountyMaker is
    IBountyMaker,
    IERC721Receiver,
    IERC1155Receiver,
    Context
{
    address[] private _daos;
    mapping(address => address[]) private _repositories; // DAO -> repositories
    mapping(address => address) private _erc20_rewards; // DAO -> ERC20BountyReward
    mapping(address => address) private _erc721_rewards; // DAO -> ERC721BountyReward

    constructor() {}

    function createBountyRepository(
        string memory bounties_metadata_uri_,
        string memory participation_metadata_uri_
    ) external virtual override {
        if (_repositories[_msgSender()].length == 0) {
            _daos.push(_msgSender());
            _erc20_rewards[_msgSender()] = address(new ERC20BountyReward());
            _erc721_rewards[_msgSender()] = address(new ERC721BountyReward());
        }
        address participations = address(
            new BountyParticipation(participation_metadata_uri_)
        );
        address claimer = address(new BountyRewardsClaimer(participations));
        address bounty = address(
            new Bounty(bounties_metadata_uri_, participations, claimer)
        );
        IERC1155(_erc20_rewards[_msgSender()]).setApprovalForAll(bounty, true);
        IERC1155(_erc721_rewards[_msgSender()]).setApprovalForAll(bounty, true);
        _repositories[_msgSender()].push(bounty);
    }

    function listAllRepositories()
        external
        view
        virtual
        override
        returns (address[] memory)
    {
        uint256 nb_repositories = 0;
        for (uint256 d = 0; d < _daos.length; ++d) {
            nb_repositories += _repositories[_daos[d]].length;
        }

        address[] memory all_repositories = new address[](nb_repositories);
        for (uint256 d = 0; d < _daos.length; ++d) {
            address dao = _daos[d];
            for (uint256 r = 0; r < _repositories[dao].length; ++r) {
                address repository = _repositories[dao][r];
                all_repositories[d + r] = repository;
            }
        }

        return all_repositories;
    }

    function createBountyWithERC20Rewards(
        address repository,
        uint256 bounty_id,
        address rewards_token,
        uint256 rewards_value
    ) external virtual override {
        address reward = _erc20_rewards[_msgSender()];
        IERC20(rewards_token).transferFrom(
            _msgSender(),
            address(this),
            rewards_value
        );
        IERC20(rewards_token).approve(reward, rewards_value);
        uint256 reward_id = IERC20BountyReward(reward).createReward(
            rewards_token,
            rewards_value
        );
        IBounty(repository).createBounty(bounty_id, reward, reward_id);
    }

    function createBountyWithERC721Rewards(
        address repository,
        uint256 bounty_id,
        address rewards_token,
        uint256 rewards_id
    ) external virtual override {
        address reward = _erc721_rewards[_msgSender()];
        IERC721(rewards_token).safeTransferFrom(
            _msgSender(),
            address(this),
            rewards_id
        );
        IERC721(rewards_token).approve(reward, rewards_id);
        uint256 reward_id = IERC721BountyReward(reward).createReward(
            rewards_token,
            rewards_id
        );
        IBounty(repository).createBounty(bounty_id, reward, reward_id);
    }

    function onERC721Received(
        address operator,
        address,
        uint256,
        bytes calldata
    ) external virtual override returns (bytes4) {
        require(
            operator == address(this),
            "BountyMaker: Can only receive ERC721 when initiated from this"
        );
        return this.onERC721Received.selector;
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
            "BountyMaker: Can only receive ERC1155 when initiated from this"
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IBountyMaker).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
