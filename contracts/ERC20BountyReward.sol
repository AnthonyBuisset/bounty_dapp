// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IERC20BountyReward.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ERC20BountyReward is IERC20BountyReward, ERC1155 {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _tokenIdTracker;

    struct Reward {
        address token;
        uint256 amount;
    }

    mapping(uint256 => Reward) private _rewards;

    constructor() ERC1155("") {}

    function createReward(
        address rewards_token_address,
        uint256 rewards_token_value
    ) external returns (uint256) {
        _rewards[_tokenIdTracker.current()] = Reward(
            rewards_token_address,
            rewards_token_value
        );
        _mint(_msgSender(), _tokenIdTracker.current(), 1, "");
        IERC20(rewards_token_address).transferFrom(
            _msgSender(),
            address(this),
            rewards_token_value
        );
        _tokenIdTracker.increment();
        return _tokenIdTracker.current() - 1;
    }

    function transfer(address contributor_, uint256 id_, uint256 amount_)
        external
        virtual
        override
    {
        Reward storage reward = _rewards[id_];
        reward.amount.sub(amount_, "ERC20BountyReward: Insufficient reward balance");
        IERC20(reward.token).transfer(contributor_, amount_);
    }

    function supply(uint256 id_) external view virtual override returns(uint256) {
        return _rewards[id_].amount;
    }
}
