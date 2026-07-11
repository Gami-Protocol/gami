# Gami Protocol — ICO Web Portal

Marketing site and token sale portal for the $GAMI raise.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing + protocol flywheel |
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

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_VESTING_ADDRESS=
NEXT_PUBLIC_APP_STORE_URL=
NEXT_PUBLIC_PLAY_STORE_URL=
NEXT_PUBLIC_TESTFLIGHT_URL=
```
