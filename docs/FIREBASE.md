# Firebase Auth + Firestore (Gami Web)

Primary backend for account auth and waitlist storage.

## Project

- **Firebase project ID:** `gami-protocol`
- **Project number / messaging sender:** `476154037926`
- Web app ID: `1:476154037926:web:124de45220907b40ec5667`
- Client SDK config defaults live in `gami-web/src/lib/env.ts` (overridable via `VITE_FIREBASE_*`).

## One-time CLI setup

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use gami-protocol

# Print SDK config (already wired in the repo)
npx -y firebase-tools@latest apps:sdkconfig WEB 1:476154037926:web:124de45220907b40ec5667 --project gami-protocol

# Enable Email/Password + Google Sign-In (from firebase.json)
npx -y firebase-tools@latest deploy --only auth,firestore --project gami-protocol
```

### Phone Authentication

Phone/SMS cannot be enabled via `firebase.json` today. Enable it in the console:

1. [Authentication → Sign-in method](https://console.firebase.google.com/project/gami-protocol/authentication/providers)
2. Enable **Phone**
3. Add test phone numbers for local development if needed

Also ensure these are in **Authorized domains**:

- `localhost`
- `gamiprotocol.io`
- `www.gamiprotocol.io`
- `gami.xyz` (legacy)

## App routes

| Route | Purpose |
|-------|---------|
| `/auth` | Email/password, Google, Phone sign-in |
| `/waitlist` | Writes to Firestore `waitlist` when Firebase is configured |
| `/waitlist/live` | Live waitlist counter + email alert subscription (`https://gamiprotocol.io/waitlist/live`) |

## Live waitlist email alerts

1. Open `/waitlist/live` and subscribe your email (defaults to `waitlist@gamiprotocol.io`).
2. Each new signup increments Firestore `stats/waitlist` (live UI via `onSnapshot`).
3. Emails are sent by either:
   - **Firebase Function** `onWaitlistCreated` (set `RESEND_API_KEY`, `WAITLIST_ALERT_EMAILS`)
   - **Supabase** `waitlist-notify` edge function (same env vars; used when `VITE_WAITLIST_NOTIFY_URL` / Supabase functions URL is set)

```bash
# Firebase functions
firebase functions:secrets:set RESEND_API_KEY
npx -y firebase-tools@latest deploy --only functions,firestore --project gami-protocol

# Or Supabase edge
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set WAITLIST_ALERT_EMAILS=waitlist@gamiprotocol.io
supabase functions deploy waitlist-notify
```

Avoid enabling **both** client notify URL and the Firebase email function at once, or you may get duplicate emails.

## Firestore collections

- `users/{uid}` — profile mirror after sign-in
- `waitlist/{email}` — waitlist + wallet for TGE distribution
- `stats/waitlist` — public live counter
- `waitlist_alert_subscribers/{email}` — live email alert opt-ins

## Env (`gami-web/.env`)

```
VITE_FIREBASE_API_KEY=AIzaSyAmH2y1bsVUDvBwaTkzh10lcSNPeafaMJI
VITE_FIREBASE_AUTH_DOMAIN=gami-protocol.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gami-protocol
VITE_FIREBASE_STORAGE_BUCKET=gami-protocol.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=476154037926
VITE_FIREBASE_APP_ID=1:476154037926:web:124de45220907b40ec5667
VITE_FIREBASE_MEASUREMENT_ID=
```
