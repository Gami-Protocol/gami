# Gami Protocol — ICO Web Portal

Marketing site and token sale portal for the $GAMI raise. Built with **Vite + React + React Router**.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/waitlist` | ICO waitlist launchpad |
| `/tokenomics` | Allocation chart + burn engine |
| `/whitepaper` | Full tokenization doc |
| `/sale` | Live sale dashboard |
| `/sale/contribute` | Waitlist + contribution flow |
| `/claim` | Post-TGE vesting claim |
| `/wallet` | Download links + referral QR |

## Setup

```bash
cd gami-web
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Environment

All client env vars use the `VITE_` prefix (see `.env.example`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CHAIN_ID=84532
VITE_TOKEN_SALE_ADDRESS=
VITE_GAMI_TOKEN_ADDRESS=
VITE_USDC_ADDRESS=
VITE_VESTING_ADDRESS=
VITE_BLOCKED_COUNTRIES=US,CU,IR,KP,SY
```

Deploy contracts first (`cd gami-contracts && npm run deploy:sepolia`), then copy addresses from `deployments/84532.json`.

## Deploy (Vercel)

**Option A — Root Directory = `gami-web` (recommended)**

1. In Vercel project settings, set **Root Directory** to `gami-web`
2. Set **Framework Preset** to **Other** (do not use the Vite preset — it runs `vite build` directly and can conflict with monorepo installs)
3. Add the `VITE_*` environment variables from `.env.example`
4. Build/install/output are configured in `gami-web/vercel.json`

**Option B — Repository root**

If Root Directory is left empty, the root `vercel.json` installs and builds from `gami-web/` automatically.

The Expo wallet app at the repo root is not deployed to Vercel; only this Vite portal is.
