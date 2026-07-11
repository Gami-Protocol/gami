// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VestingVault
 * @notice Cliff + linear vesting for token sale participants.
 */
contract VestingVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimed;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        uint256 tgeUnlockBps; // basis points unlocked at TGE (e.g. 1500 = 15%)
    }

    IERC20 public immutable token;
    mapping(address => VestingSchedule) public schedules;

    event VestingCreated(address indexed beneficiary, uint256 amount);
    event TokensClaimed(address indexed beneficiary, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function createVesting(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        uint256 tgeUnlockBps
    ) external onlyOwner {
        require(beneficiary != address(0), "zero address");
        require(amount > 0, "zero amount");
        require(tgeUnlockBps <= 10_000, "invalid bps");

        schedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            claimed: 0,
            startTime: startTime,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            tgeUnlockBps: tgeUnlockBps
        });

        emit VestingCreated(beneficiary, amount);
    }

    function claimable(address beneficiary) public view returns (uint256) {
        VestingSchedule memory s = schedules[beneficiary];
        if (s.totalAmount == 0) return 0;

        uint256 vested = _vestedAmount(s);
        return vested > s.claimed ? vested - s.claimed : 0;
    }

    function claim() external nonReentrant {
        uint256 amount = claimable(msg.sender);
        require(amount > 0, "nothing to claim");

        schedules[msg.sender].claimed += amount;
        token.safeTransfer(msg.sender, amount);

        emit TokensClaimed(msg.sender, amount);
    }

    function _vestedAmount(VestingSchedule memory s) internal view returns (uint256) {
        if (block.timestamp < s.startTime) return 0;

        uint256 tgeAmount = (s.totalAmount * s.tgeUnlockBps) / 10_000;
        uint256 remaining = s.totalAmount - tgeAmount;

        if (block.timestamp < s.startTime + s.cliffDuration) {
            return tgeAmount;
        }

        uint256 elapsed = block.timestamp - (s.startTime + s.cliffDuration);
        if (elapsed >= s.vestingDuration) {
            return s.totalAmount;
        }

        uint256 linearVested = (remaining * elapsed) / s.vestingDuration;
        return tgeAmount + linearVested;
    }
}

/**
 * @title TokenSale
 * @notice Accepts ETH or USDC for $GAMI allocation with phase caps and whitelist.
 */
contract TokenSale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Phase { CLOSED, SEED, PRIVATE, PUBLIC }

    IERC20 public immutable gamiToken;
    IERC20 public immutable paymentToken; // USDC (address(0) for ETH-only mode)
    VestingVault public immutable vestingVault;

    Phase public currentPhase = Phase.CLOSED;
    uint256 public pricePerToken; // payment token units (6 decimals for USDC) per 1 GAMI (18 decimals)
    uint256 public hardCap;
    uint256 public perWalletCap;
    uint256 public totalRaised;
    uint256 public totalSold;

    bytes32 public merkleRoot;
    mapping(address => uint256) public contributed;
    mapping(address => uint256) public allocation;

    event PhaseChanged(Phase phase);
    event Contribution(address indexed buyer, uint256 paymentAmount, uint256 gamiAmount);
    event WhitelistUpdated(bytes32 merkleRoot);

    constructor(
        address _gamiToken,
        address _paymentToken,
        address _vestingVault
    ) Ownable(msg.sender) {
        gamiToken = IERC20(_gamiToken);
        paymentToken = IERC20(_paymentToken);
        vestingVault = VestingVault(_vestingVault);
    }

    function setPhase(Phase phase) external onlyOwner {
        currentPhase = phase;
        emit PhaseChanged(phase);
    }

    function setParams(
        uint256 _pricePerToken,
        uint256 _hardCap,
        uint256 _perWalletCap
    ) external onlyOwner {
        pricePerToken = _pricePerToken;
        hardCap = _hardCap;
        perWalletCap = _perWalletCap;
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;
        emit WhitelistUpdated(_root);
    }

    function contributeUSDC(uint256 amount, bytes32[] calldata proof) external nonReentrant {
        require(currentPhase != Phase.CLOSED, "sale closed");
        require(address(paymentToken) != address(0), "USDC disabled");
        if (currentPhase != Phase.PUBLIC) {
            require(_verifyWhitelist(msg.sender, proof), "not whitelisted");
        }

        require(totalRaised + amount <= hardCap, "hard cap");
        require(contributed[msg.sender] + amount <= perWalletCap, "wallet cap");

        uint256 gamiAmount = (amount * 1e18) / pricePerToken;
        require(gamiAmount > 0, "too small");

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        totalRaised += amount;
        totalSold += gamiAmount;
        contributed[msg.sender] += amount;
        allocation[msg.sender] += gamiAmount;

        emit Contribution(msg.sender, amount, gamiAmount);
    }

    function contributeETH(bytes32[] calldata proof) external payable nonReentrant {
        require(currentPhase != Phase.CLOSED, "sale closed");
        if (currentPhase != Phase.PUBLIC) {
            require(_verifyWhitelist(msg.sender, proof), "not whitelisted");
        }

        uint256 amount = msg.value;
        require(totalRaised + amount <= hardCap, "hard cap");
        require(contributed[msg.sender] + amount <= perWalletCap, "wallet cap");

        uint256 gamiAmount = (amount * 1e18) / pricePerToken;
        require(gamiAmount > 0, "too small");

        totalRaised += amount;
        totalSold += gamiAmount;
        contributed[msg.sender] += amount;
        allocation[msg.sender] += gamiAmount;

        emit Contribution(msg.sender, amount, gamiAmount);
    }

    function finalizeSale(
        uint256 vestingStart,
        uint256 cliffDuration,
        uint256 vestingDuration,
        uint256 tgeUnlockBps
    ) external onlyOwner {
        require(currentPhase == Phase.CLOSED || totalRaised >= hardCap, "sale active");

        // Transfer GAMI to vesting vault and create schedules for all contributors
        // In production, iterate off-chain and batch create vesting schedules
        gamiToken.approve(address(vestingVault), totalSold);
    }

    function withdrawPayments(address to) external onlyOwner {
        if (address(paymentToken) != address(0)) {
            paymentToken.safeTransfer(to, paymentToken.balanceOf(address(this)));
        }
        payable(to).transfer(address(this).balance);
    }

    function _verifyWhitelist(address account, bytes32[] calldata proof) internal view returns (bool) {
        if (merkleRoot == bytes32(0)) return true;
        bytes32 leaf = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    receive() external payable {}
}
