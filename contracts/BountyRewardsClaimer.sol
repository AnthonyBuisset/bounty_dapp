// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/IBountyRewardsClaimer.sol";
import "../interfaces/IBountyReward.sol";
import "../interfaces/IBountyParticipation.sol";

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract BountyRewardsClaimer is Context, IBountyRewardsClaimer, IERC1155Receiver {
    address private _participations;

    struct Reward {
        address token;
        uint256 id;
    }

    mapping(uint256 => Reward) _claimable_participations;

    constructor(address _participations_) {
        _participations = _participations_;
    }

    function unlockReward(
        address reward_address_,
        uint256 reward_id_,
        uint256 participation_id_
    ) external virtual override {
        _claimable_participations[participation_id_] = Reward(
            reward_address_,
            reward_id_
        );
    }

    function claim(uint256 participation_id_, address contributor_)
        external
        virtual
        override
    {
        uint256 amount = IERC1155(_participations).balanceOf(_msgSender(), participation_id_);
        require(amount > 0, "BountyRewardsClaimer: Insufficient balance");
        IERC1155(_participations).safeTransferFrom(_msgSender(), address(this), participation_id_, amount, "");
        Reward memory reward = _claimable_participations[participation_id_];
        IBountyReward(reward.token).transfer(contributor_, reward.id, amount);
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
            "BountyRewardsClaimer: Can only receive ERC1155 when initiated from this"
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
            interfaceId == type(IBountyRewardsClaimer).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
