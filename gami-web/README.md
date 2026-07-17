# Gami Protocol — ICO Web Portal

Marketing site and token sale portal for the $GAMI raise. Built with **Vite + React + React Router**.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/about` | About Gami Protocol |
| `/agents` | AI Agents product page |
| `/app` | App dashboard (wallet launch) |
| `/developers/docs` | Developer documentation |
| `/developers/mcp-client` | MCP client reference |
| `/developers/mcp-server` | MCP server access |
| `/status` | Protocol system status |
| `/waitlist` | ICO waitlist launchpad (Firestore when Firebase is configured) |
| `/waitlist/live` | Live waitlist counter + email alerts |
| `/auth` | Firebase Auth (email/password, Google, phone) |
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
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=869899204398
VITE_FIREBASE_APP_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PRIVY_APP_ID=
VITE_CHAIN_ID=84532
VITE_TOKEN_SALE_ADDRESS=
VITE_GAMI_TOKEN_ADDRESS=
VITE_USDC_ADDRESS=
VITE_VESTING_ADDRESS=
VITE_RAMP_HOST_API_KEY=
VITE_RAMP_ENVIRONMENT=demo
VITE_BLOCKED_COUNTRIES=US,CU,IR,KP,SY
```

See `docs/FIREBASE.md` for Auth provider enablement and Firestore deploy.

Set `VITE_PRIVY_APP_ID` to enable Privy email/wallet sign-in on the sale flow. Users who sign in with email
receive a Privy embedded Ethereum wallet. The wallet menu lets them switch to that Privy wallet or connect
external wallets (MetaMask, Coinbase, Rainbow, WalletConnect). Set `VITE_WALLETCONNECT_PROJECT_ID` for
WalletConnect QR support.

### Payment gateway

The sale contract accepts **USDC only**. Card/fiat and other cryptos fund the linked wallet first:

| Route | Provider | Notes |
|-------|----------|-------|
| Card / Fiat | Coinbase via Privy `fundWallet` | Enable Coinbase/Moonpay funding in the Privy dashboard |
| Card / Fiat | Ramp Instant | Set `VITE_RAMP_HOST_API_KEY` (`demo` or production) |
| USDT / ETH / other | Uniswap + Aerodrome deep-links | Swap to USDC on Base, then contribute |
| Optional overrides | `VITE_FIAT_ONRAMP_URL`, `VITE_USDT_SWAP_URL` | Support `{wallet}`, `{amount}`, `{usdc}` |

Deploy contracts first (`cd gami-contracts && npm run deploy:sepolia`), then copy addresses from `deployments/84532.json`.

### Waitlist → Supabase (TGE wallets)

`/waitlist`, the home CTA, and `/sale/contribute` all call `joinWaitlist()`, which posts to the
`waitlist-join` edge function (with a Rest fallback). Rows land in the Supabase `waitlist` table;
valid wallets are exposed via `waitlist_distribution` for TGE export:

```bash
# From monorepo root
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  npm run export:waitlist -- --format csv --out ./waitlist-wallets.csv
```

See `docs/DISTRIBUTION.md` for the full TGE export flow.

## Deploy (Vercel)

**Option A — Root Directory = `gami-web` (recommended)**

1. In Vercel project settings, set **Root Directory** to `gami-web`
2. Set **Framework Preset** to **Other** (do not use the Vite preset — it runs `vite build` directly and can conflict with monorepo installs)
3. Add the `VITE_*` environment variables from `.env.example`
4. Build/install/output are configured in `gami-web/vercel.json`

**Option B — Repository root**

If Root Directory is left empty, the root `vercel.json` installs and builds from `gami-web/` automatically.

The Expo wallet app at the repo root is not deployed to Vercel; only this Vite portal is.
