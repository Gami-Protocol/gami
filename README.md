# Gami Protocol

Gami is a gamified crypto ecosystem built on Base, featuring a mobile wallet app, an ICO web portal, smart contracts for the $GAMI token, and an AI-powered agentic quest interface.

## Repository structure

| Directory | Description |
|-----------|-------------|
| `/` (root) | React Native / Expo mobile wallet app |
| [`gami-contracts/`](gami-contracts/) | Solidity smart contracts (ERC-20, token sale, vesting, fee routing) |
| [`gami-web/`](gami-web/) | Legacy ICO portal — Vite + React (sale/claim flows) |
| [`gami-site/`](gami-site/) | **Marketing website v2** — Next.js 15 (Home, Wallet, Developers, Partners, AI, Roadmap, Waitlist) |
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
- Privy (identity + embedded wallet — the only signup/wallet provider)
- Supabase (off-chain profile store & database)
- Viem (blockchain interactions)
- Zustand (state management)
- Tailwind CSS via Uniwind

### Signup + wallet (Privy)

Signup, login and the wallet are all [privy.io](https://privy.io) — there is no
local/mock wallet path. Email OTP creates the account and Privy provisions an
embedded Ethereum wallet on first login (`createOnLogin: 'all-users'`); Supabase
only stores the off-chain profile row (handle, XP, settings) keyed by the Privy
user id.

| Surface | SDK |
|---------|-----|
| Expo native | `@privy-io/expo` (`lib/privy-bridge.ts`) |
| Expo web | `@privy-io/react-auth` (`lib/privy-bridge.web.ts`) |
| `gami-web/` sale site | `@privy-io/react-auth` |

Config:

| Variable | Where | Notes |
|----------|-------|-------|
| `EXPO_PUBLIC_PRIVY_APP_ID` / `VITE_PRIVY_APP_ID` | client | Public. Defaults to the Gami app ID, baked into builds. |
| `EXPO_PUBLIC_PRIVY_CLIENT_ID` | client, native | Optional app client from the Privy dashboard. |
| `PRIVY_APP_SECRET` | **server only** | Edge Functions / API routes. Never commit it or ship it in a bundle. |

Expo Go cannot load Privy's native modules, so onboarding there reports that a
dev build is required instead of creating a wallet.

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
