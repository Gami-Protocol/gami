# Gami Protocol Smart Contracts

Solidity contracts for the $GAMI token raise on Base.

## Contracts

| Contract | Purpose |
|----------|---------|
| `GAMI.sol` | ERC-20 fixed supply (1B tokens) |
| `TokenSale.sol` | Phased ICO accepting ETH/USDC |
| `VestingVault.sol` | Cliff + linear vesting with TGE unlock |
| `FeeRouter.sol` | 40/30/20/10 fee routing (burn/treasury/staking/LP) |

## Setup

```bash
cd gami-contracts
npm install
cp .env.example .env
npm run compile
npm test
```

## Deploy (Base Sepolia)

```bash
npm run deploy:sepolia
```

## Environment

```
DEPLOYER_PRIVATE_KEY=
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
BASESCAN_API_KEY=
USDC_ADDRESS=0x...  # Base USDC
```

## Security

- Run `slither .` before mainnet
- External audit required before mainnet deploy
- See `docs/audit/CHECKLIST.md`
