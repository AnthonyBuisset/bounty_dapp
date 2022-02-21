// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IBountyRewardsClaimer {
    function unlockReward(
        address reward_address_,
        uint256 reward_id_,
        uint256 participation_id_
    ) external;

    function claim(uint256 participation_id_, address contributor_) external;
}
