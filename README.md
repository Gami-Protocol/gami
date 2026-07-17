# Gami Protocol

Gami is a gamified crypto ecosystem built on Base, featuring a mobile wallet app, an ICO web portal, smart contracts for the $GAMI token, and an AI-powered agentic quest interface.

## Repository structure

| Directory | Description |
|-----------|-------------|
| `/` (root) | React Native / Expo mobile wallet app |
| [`gami-contracts/`](gami-contracts/) | Solidity smart contracts (ERC-20, token sale, vesting, fee routing) |
| [`gami-web/`](gami-web/) | ICO web portal — Vite + React + React Router |
| [`gami-agentic-web/`](gami-agentic-web/) | Agentic Quest Chat interface — Next.js 15 (MCP server + client) |

## Mobile wallet app (Expo)

### Prerequisites

Node.js & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Getting started

```sh
git clone https://github.com/Gami-Protocol/gami.git
cd gami

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the Expo development server
npx expo start
```

Scan the QR code with Expo Go ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) to run the app on your device.

### Tech stack

- React Native + Expo (SDK 54)
- Expo Router (file-based navigation)
- TypeScript
- Privy (embedded wallet / auth)
- Supabase (backend & database)
- Viem (blockchain interactions)
- Zustand (state management)
- Tailwind CSS via Uniwind

## Smart contracts (`gami-contracts/`)

Solidity contracts for the $GAMI token raise on Base.

| Contract | Purpose |
|----------|---------|
| `GAMI.sol` | ERC-20 fixed supply (1B tokens) |
| `TokenSale.sol` | Phased ICO accepting ETH/USDC |
| `VestingVault.sol` | Cliff + linear vesting with TGE unlock |
| `FeeRouter.sol` | 40/30/20/10 fee routing (burn/treasury/staking/LP) |

```sh
cd gami-contracts
npm install
cp .env.example .env
npm run compile
npm test

# Deploy to Base Sepolia
npm run deploy:sepolia
```

## ICO web portal (`gami-web/`)

Marketing site and token sale portal for the $GAMI raise. Built with Vite + React + React Router.

```sh
cd gami-web
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Agentic Quest Chat (`gami-agentic-web/`)

AI-powered questing chat interface for the Gami Protocol agent layer. Built with Next.js 15.

```sh
cd gami-agentic-web
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3010](http://localhost:3010).

## Development

### Linting & formatting

```sh
# Lint (oxlint)
npm run lint
npm run lint:css

# Format check
npm run format:check

# Format write
npm run format
```

### Run on iOS / Android

```sh
npm run ios
npm run android
```
