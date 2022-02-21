// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Tether is ERC20 {
    constructor() ERC20("Tether", "USDT") {
        _mint(_msgSender(), 10000 * 10**decimals());
    }
}
