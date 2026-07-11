// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakingRewards
 * @notice Stake $GAMI for revenue share (20% of protocol fees routed here).
 */
contract StakingRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable gamiToken;

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount);

    constructor(address _gamiToken) Ownable(msg.sender) {
        gamiToken = IERC20(_gamiToken);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");
        gamiToken.safeTransferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0 && staked[msg.sender] >= amount, "insufficient stake");
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        gamiToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function distributeRewards(uint256 amount) external onlyOwner {
        require(totalStaked > 0, "no stakers");
        gamiToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsDistributed(amount);
    }
}
