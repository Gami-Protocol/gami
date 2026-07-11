// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GAMI
 * @notice Fixed-supply governance token for Gami Protocol.
 *         Total supply: 1 billion tokens (18 decimals).
 */
contract GAMI is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 ether;

    constructor(address initialOwner) ERC20("Gami Protocol", "GAMI") Ownable(initialOwner) {
        _mint(initialOwner, MAX_SUPPLY);
    }
}
