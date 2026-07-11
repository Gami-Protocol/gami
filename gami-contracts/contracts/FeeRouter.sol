// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FeeRouter
 * @notice Routes protocol revenue per Gami monetary policy:
 *         40% burn, 30% treasury, 20% staking, 10% liquidity.
 */
contract FeeRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable gamiToken;

    address public treasury;
    address public stakingRewards;
    address public liquidityPool;

    uint16 public burnBps = 4000;
    uint16 public treasuryBps = 3000;
    uint16 public stakingBps = 2000;
    uint16 public liquidityBps = 1000;

    uint256 public totalBurned;
    uint256 public totalRouted;

    event FeesRouted(uint256 amount, uint256 burned, uint256 toTreasury, uint256 toStaking, uint256 toLiquidity);
    event AllocationUpdated(uint16 burnBps, uint16 treasuryBps, uint16 stakingBps, uint16 liquidityBps);

    constructor(address _gamiToken, address _treasury, address _staking, address _liquidity) Ownable(msg.sender) {
        gamiToken = IERC20(_gamiToken);
        treasury = _treasury;
        stakingRewards = _staking;
        liquidityPool = _liquidity;
    }

    function routeFees(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");
        gamiToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 burnAmount = (amount * burnBps) / 10_000;
        uint256 treasuryAmount = (amount * treasuryBps) / 10_000;
        uint256 stakingAmount = (amount * stakingBps) / 10_000;
        uint256 liquidityAmount = amount - burnAmount - treasuryAmount - stakingAmount;

        if (burnAmount > 0) {
            gamiToken.transfer(address(0xdead), burnAmount);
            totalBurned += burnAmount;
        }
        if (treasuryAmount > 0) gamiToken.safeTransfer(treasury, treasuryAmount);
        if (stakingAmount > 0) gamiToken.safeTransfer(stakingRewards, stakingAmount);
        if (liquidityAmount > 0) gamiToken.safeTransfer(liquidityPool, liquidityAmount);

        totalRouted += amount;
        emit FeesRouted(amount, burnAmount, treasuryAmount, stakingAmount, liquidityAmount);
    }

    function setAllocation(
        uint16 _burnBps,
        uint16 _treasuryBps,
        uint16 _stakingBps,
        uint16 _liquidityBps
    ) external onlyOwner {
        require(_burnBps + _treasuryBps + _stakingBps + _liquidityBps == 10_000, "must sum 100%");
        require(_burnBps >= 3500 && _burnBps <= 4500, "burn out of bounds");
        burnBps = _burnBps;
        treasuryBps = _treasuryBps;
        stakingBps = _stakingBps;
        liquidityBps = _liquidityBps;
        emit AllocationUpdated(_burnBps, _treasuryBps, _stakingBps, _liquidityBps);
    }

    function setDestinations(address _treasury, address _staking, address _liquidity) external onlyOwner {
        treasury = _treasury;
        stakingRewards = _staking;
        liquidityPool = _liquidity;
    }
}
