// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IBountyParticipation {

    function init(string memory metadata_uri_) external ;
    
    function create(
        uint256 id_,
        address[] calldata contributors_,
        uint256[] calldata dispatch_
    ) external;

    function approve(uint256 id_) external;

    function isApproved(uint256 id_) external view returns (bool);
}
