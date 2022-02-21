// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Arrays.sol)

pragma solidity ^0.8.0;

/**
 * @dev Collection of functions related to array types.
 */
library Array {
    function sum(uint256[] memory array_) internal pure returns(uint256) {
        uint256 total = 0;
        for(uint256 i = 0; i < array_.length; ++i) {
            total += array_[i];
        }
        return total;
    }
}
