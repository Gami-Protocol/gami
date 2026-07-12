# Gami Protocol

Gami is a gamified crypto rewards protocol on Base. This monorepo contains the mobile wallet app, ICO web portal, agentic quest chat interface, and Solidity smart contracts.

## Repository structure

| Directory | Description |
|-----------|-------------|
| `/` (root) | Expo React Native mobile wallet app |
| [`gami-web/`](gami-web/) | Vite + React ICO web portal (marketing, token sale, tokenomics) |
| [`gami-agentic-web/`](gami-agentic-web/) | Next.js 15 agentic quest chat interface |
| [`gami-contracts/`](gami-contracts/) | Hardhat Solidity smart contracts ($GAMI token, sale, vesting) |

## Tech stack

**Mobile wallet (root)**
- React Native + Expo + TypeScript
- Expo Router (navigation)
- Privy (embedded wallet auth)
- Supabase (backend / database)
- Viem (on-chain interactions)
- Zustand (state management)

**ICO web portal (`gami-web/`)**
- Vite + React + React Router
- Tailwind CSS

**Agentic quest chat (`gami-agentic-web/`)**
- Next.js 15 (App Router, React 19)
- Tailwind CSS v4
- Zustand + Zod

**Smart contracts (`gami-contracts/`)**
- Hardhat + TypeScript
- Solidity — deployed on Base

## Getting started

### Mobile wallet

```sh
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your phone.

### ICO web portal

```sh
cd gami-web
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Agentic quest chat

```sh
cd gami-agentic-web
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3010](http://localhost:3010).

### Smart contracts

```sh
cd gami-contracts
npm install
cp .env.example .env
npm run compile
npm test
```

Deploy to Base Sepolia:

```sh
npm run deploy:sepolia
```

## Smart contracts

| Contract | Purpose |
|----------|---------|
| `GAMI.sol` | ERC-20 fixed supply (1 billion tokens) |
| `TokenSale.sol` | Phased ICO accepting ETH / USDC |
| `VestingVault.sol` | Cliff + linear vesting with TGE unlock |
| `FeeRouter.sol` | Fee routing — burn / treasury / staking / LP |

## Linting & formatting

```sh
npm run lint        # oxlint
npm run lint:css    # CSS lint
npm run format      # oxfmt (write)
npm run format:check
```
