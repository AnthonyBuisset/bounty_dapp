// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IERC721BountyReward.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721BountyReward is IERC721BountyReward, ERC1155, IERC721Receiver {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;

    struct Reward {
        address token;
        uint256 id;
    }

    mapping(uint256 => Reward) private _rewards;

    constructor() ERC1155("") {}

    function createReward(
        address rewards_token_address,
        uint256 rewards_token_id
    ) external override virtual returns (uint256) {
        _rewards[_tokenIdTracker.current()] = Reward(
            rewards_token_address,
            rewards_token_id
        );
        _mint(_msgSender(), _tokenIdTracker.current(), 1, "");
        _tokenIdTracker.increment();
        IERC721(rewards_token_address).safeTransferFrom(
            _msgSender(),
            address(this),
            rewards_token_id
        );
        return _tokenIdTracker.current() - 1;
    }

    function onERC721Received(
        address operator,
        address,
        uint256,
        bytes calldata
    ) external virtual override returns (bytes4) {
        require(
            operator == address(this),
            "ERC721BountyReward: Can only receive ERC721 when initiated from this"
        );
        return this.onERC721Received.selector;
    }

    function transfer(address contributor_, uint256 id_, uint256 )
        external
        virtual
        override
    {
        Reward memory reward = _rewards[id_];
        IERC721(reward.token).safeTransferFrom(
            address(this),
            contributor_,
            reward.id
        );
    }

    function supply(uint256) external view virtual override returns(uint256) {
        return 1;
    }
}
