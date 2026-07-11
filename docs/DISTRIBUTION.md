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

1. User joins waitlist on gami-web `/sale/contribute`
2. Receives email with wallet download QR (`/wallet?ref=CODE`)
3. Opens wallet → referral XP bonus applied
4. Completes KYC on web → "Verified" badge unlocked
5. Contributes USDC → +500 XP push notification
6. TGE → claims via in-app `/claim` screen

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
