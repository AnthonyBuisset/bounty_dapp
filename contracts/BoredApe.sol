// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract BoredApe is ERC721PresetMinterPauserAutoId {
    constructor()
        ERC721PresetMinterPauserAutoId(
            "Bored Ape",
            "APE",
            "https://bored/ape/base/uri/"
        )
    {}
}
