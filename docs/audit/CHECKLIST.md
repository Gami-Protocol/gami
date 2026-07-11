# Smart Contract Audit Checklist

Pre-mainnet audit preparation for Gami Protocol contracts.

## Contracts in Scope

- [ ] `GAMI.sol` — ERC-20 fixed supply
- [ ] `TokenSale.sol` — Phased ICO with whitelist
- [ ] `VestingVault.sol` — Cliff + linear vesting
- [ ] `FeeRouter.sol` — Revenue routing + burn

## Automated Analysis

```bash
cd gami-contracts
npm run compile
npm test
# pip install slither-analyzer
slither . --exclude-dependencies
```

## Manual Review Items

- [ ] Access control on all owner functions
- [ ] Reentrancy guards on fund-moving functions
- [ ] Merkle whitelist cannot be bypassed in private phase
- [ ] Per-wallet and hard caps enforced correctly
- [ ] Vesting math matches tokenomics (15% TGE, 12mo linear)
- [ ] FeeRouter allocation sums to 100% and burn bounds enforced
- [ ] No unbounded loops in on-chain finalize
- [ ] USDC approval flow secure (safeTransferFrom)
- [ ] ETH receive path handles refunds

## Deployment Checklist (Base Mainnet)

- [ ] Deploy GAMI → verify on Basescan
- [ ] Deploy VestingVault → verify
- [ ] Deploy TokenSale → verify
- [ ] Deploy FeeRouter → verify
- [ ] Transfer sale allocation to TokenSale contract
- [ ] Set Merkle root for private phase
- [ ] Configure sale params (price, caps)
- [ ] Multisig treasury (Gnosis Safe 3/5)
- [ ] Timelock on parameter changes (48h minimum)
- [ ] Publish contract addresses to `deployments/8453.json`

## TGE Launch

- [ ] Set sale phase to CLOSED
- [ ] Batch-create vesting schedules for all participants
- [ ] Enable claim in wallet (`EXPO_PUBLIC_VESTING_ADDRESS`)
- [ ] Enable claim on gami-web (`NEXT_PUBLIC_VESTING_ADDRESS`)
- [ ] Monitor first 24h claims
- [ ] Publish burn dashboard feed

## Post-TGE Hooks

- FeeRouter integrated with protocol revenue pipeline
- StakingRewards contract (Phase 2) for 20% revenue share
- Nova AI read-only treasury metrics via `sale-stats` edge function
