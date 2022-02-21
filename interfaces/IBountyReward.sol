// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IBountyReward {
    function transfer(address contributor_, uint256 id_, uint256 percent_) external;
    function supply(uint256 id_) external view returns(uint256);
}
