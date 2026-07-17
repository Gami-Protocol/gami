# Firebase Auth + Firestore (Gami Web)

Primary backend for account auth and waitlist storage.

## Project

- **GCP / Firebase project number:** `869899204398`
- Web app nickname: `gami-web`
- Client SDK config is loaded from `VITE_FIREBASE_*` env vars in `gami-web`.

## One-time CLI setup

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest projects:list
# Select the project whose project number is 869899204398
npx -y firebase-tools@latest use <PROJECT_ID>

# Register the web app (skip if it already exists)
npx -y firebase-tools@latest apps:create web gami-web --project <PROJECT_ID>

# Print SDK config and copy into gami-web/.env
npx -y firebase-tools@latest apps:sdkconfig WEB <APP_ID> --project <PROJECT_ID>

# Enable Email/Password + Google Sign-In (from firebase.json)
npx -y firebase-tools@latest deploy --only auth,firestore --project <PROJECT_ID>
```

### Phone Authentication

Phone/SMS cannot be enabled via `firebase.json` today. Enable it in the console:

1. [Authentication → Sign-in method](https://console.firebase.google.com/project/_/authentication/providers)
2. Enable **Phone**
3. Add test phone numbers for local development if needed

Also ensure `localhost` and `gami.xyz` are in **Authorized domains**.

## App routes

| Route | Purpose |
|-------|---------|
| `/auth` | Email/password, Google, Phone sign-in |
| `/waitlist` | Writes to Firestore `waitlist` when Firebase is configured |
| `/waitlist/live` | Live waitlist counter + email alert subscription |

## Live waitlist email alerts

1. Open `/waitlist/live` and subscribe your email (defaults to your ops inbox).
2. Each new signup increments Firestore `stats/waitlist` (live UI via `onSnapshot`).
3. Emails are sent by either:
   - **Firebase Function** `onWaitlistCreated` (set `RESEND_API_KEY`, `WAITLIST_ALERT_EMAILS`)
   - **Supabase** `waitlist-notify` edge function (same env vars; used when `VITE_WAITLIST_NOTIFY_URL` / Supabase functions URL is set)

```bash
# Firebase functions
firebase functions:secrets:set RESEND_API_KEY
npx -y firebase-tools@latest deploy --only functions,firestore

# Or Supabase edge
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set WAITLIST_ALERT_EMAILS=waitlist@gamiprotocol.io
supabase functions deploy waitlist-notify
```

Avoid enabling **both** client notify URL and the Firebase email function at once, or you may get duplicate emails.

## Firestore collections

- `users/{uid}` — profile mirror after sign-in
- `waitlist/{email}` — waitlist + wallet for TGE distribution

## Env (`gami-web/.env`)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=869899204398
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```
