# Gami Wallet — App Store Distribution

## iOS (TestFlight → App Store)

1. Open [Bilt Project Settings → App Store](https://app.bilt.me/agent/73c82cd4-2f64-41e0-a0f2-3c4fa607c6bb)
2. Send message: "Deploy this app to production"
3. Submit TestFlight build for beta testers
4. Promote to App Store after ICO waitlist phase

## Android (Play Store)

1. Bilt generates signed AAB
2. Upload to Google Play Console → Internal testing
3. Promote to production track

## Deep Links

The wallet registers `gami://` scheme for:

- `gami://ref/{CODE}` — referral attribution
- `gami://onboarding/welcome` — direct onboarding

Configure associated domains in `app.config.ts` when `gami.xyz` is live:

```json
{
  "ios": {
    "associatedDomains": ["applinks:gami.xyz"]
  },
  "android": {
    "intentFilters": [{
      "action": "VIEW",
      "data": [{ "scheme": "https", "host": "gami.xyz", "pathPrefix": "/wallet" }]
    }]
  }
}
```

## ICO Distribution Flow

1. User joins waitlist on gami-web `/waitlist` or `/sale/contribute`
2. Signup is stored in Supabase `waitlist` (email, optional full name, wallet, referral, source)
3. Receives email with wallet download QR (`/wallet?ref=CODE`)
4. Opens wallet → referral XP bonus applied
5. Completes KYC on web → "Verified" badge unlocked
6. Contributes USDC → row in `sale_participants` + on-chain vesting
7. TGE → claims via in-app `/claim` screen / web `/claim`

## Waitlist → TGE Wallet Database (Supabase)

All waitlist signups persist to the Supabase `waitlist` table. Rows with a valid EVM
wallet appear in the `waitlist_distribution` view for export.

| Column | Purpose |
|--------|---------|
| `email` | Unique contact / nurture key |
| `full_name` | Display name from `/waitlist` |
| `wallet_address` | Lowercased EVM address for TGE distribution |
| `referral_code` | Attribution |
| `source` | `web`, `sale`, `home`, etc. |
| `status` | `registered` → `wallet_linked` → `eligible` → `distributed` |

### Apply migration

```bash
supabase db push
# or apply supabase/migrations/20260717000000_waitlist_tge_wallets.sql
```

Deploy the join endpoint:

```bash
supabase functions deploy waitlist-join
```

### Live waitlist count + email alerts

- UI: `/waitlist/live` — real-time Firestore counter + subscribe your email
- Emails: Resend via Firebase `onWaitlistCreated` or Supabase `waitlist-notify`
- Env: `RESEND_API_KEY`, `WAITLIST_ALERT_EMAILS=you@example.com`

### Export wallets for TGE / merkle

```bash
# Full JSON (rows + unique wallets)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  npm run export:waitlist -- --out ./waitlist-export.json

# CSV for ops / spreadsheets
npm run export:waitlist -- --format csv --out ./waitlist-wallets.csv

# Shape compatible with gami-contracts merkle-whitelist.ts
npm run export:waitlist -- --format participants --out ./participants.json
PARTICIPANTS_JSON=./participants.json npx hardhat run scripts/merkle-whitelist.ts --network base
```

Web env (gami-web):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_FUNCTIONS_URL=https://YOUR_PROJECT.supabase.co/functions/v1
```

## Environment Variables (Wallet)

```
EXPO_PUBLIC_ICO_WEB_URL=https://gami.xyz
EXPO_PUBLIC_ICO_CLAIM_URL=https://gami.xyz/claim
EXPO_PUBLIC_GAMI_TOKEN_ADDRESS=0x...
EXPO_PUBLIC_VESTING_ADDRESS=0x...
EXPO_PUBLIC_GAMI_TOKEN_ADDRESS_SEPOLIA=0x...
EXPO_PUBLIC_VESTING_ADDRESS_SEPOLIA=0x...
EXPO_PUBLIC_GAMI_CHAIN=baseSepolia
EXPO_PUBLIC_BASE_RPC=https://mainnet.base.org
EXPO_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```
