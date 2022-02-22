// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/IBountyParticipation.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract BountyParticipation is IBountyParticipation, ERC1155 {
    enum Status {
        NONE,
        PENDING,
        APPROVED,
        REJECTED
    }

    mapping(uint256 => Status) private _statuses;

    constructor() ERC1155("") {}

    function init(string memory metadata_uri_) external virtual override {
        _setURI(metadata_uri_);
    }

    function create(
        uint256 id_,
        address[] calldata contributors_,
        uint256[] calldata dispatch_
    ) external virtual override {
        require(
            _statuses[id_] == Status.NONE,
            "BountyParticipation: Participation already exists"
        );

        require(
            contributors_.length == dispatch_.length,
            "BountyParticipation: Invalid number of contributors or dispatch"
        );

        _statuses[id_] = Status.PENDING;

        for (uint8 i = 0; i < contributors_.length; ++i) {
            _mint(contributors_[i], id_, dispatch_[i], "");
        }
    }

    function approve(uint256 id_) external virtual override {
        require(
            _statuses[id_] != Status.NONE,
            "BountyParticipation: Participation does not exist"
        );
        _statuses[id_] = Status.APPROVED;
    }

    function isApproved(uint256 id_)
        external
        view
        virtual
        override
        returns (bool)
    {
        return _statuses[id_] == Status.APPROVED;
    }
}
