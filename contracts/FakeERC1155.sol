// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract FakeERC1155 is ERC1155 {
    constructor() ERC1155("") {}

    function mint(uint256 id_) external {
        _mint(_msgSender(), id_, 1, "");
    }

    function mintBatch(uint256[] calldata id_) external {
        uint256[] memory amounts = new uint256[](id_.length);
        for (uint256 i = 0; i < id_.length; ++i) {
            amounts[i] = 1;
        }
        _mintBatch(_msgSender(), id_, amounts, "");
    }

    function safeTransfer(address to_, uint256 id_) external {
        safeTransferFrom(_msgSender(), to_, id_, 1, "");
    }

    function safeTransferBatch(address to_, uint256[] calldata id_) external {
        uint256[] memory amounts = new uint256[](id_.length);
        for (uint256 i = 0; i < id_.length; ++i) {
            amounts[i] = 1;
        }
        safeBatchTransferFrom(_msgSender(), to_, id_, amounts, "");
    }
}
