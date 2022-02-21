// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./IBountyReward.sol";

interface IERC721BountyReward is IBountyReward {
    function createReward(address rewards_token, uint256 rewards_id)
        external
        returns (uint256);
}
