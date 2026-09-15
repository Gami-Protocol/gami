# Waitlist (Supabase)

Production waitlist for `gami-web` uses **Supabase** as the primary backend.

## Which Supabase project (read this before changing any env var)

There are **two** Supabase projects in this account carrying waitlist tables. Only one of
them is real.

| Project | Ref | State | Use |
| --- | --- | --- | --- |
| `gami-wallet` | `xetqhdzvbfeiedbmopew` | `ACTIVE_HEALTHY` | **This is the live waitlist.** gamiprotocol.io's bundle points here, the signups are here, and `waitlist_public_count()` reads from here. |
| `gami` | `etwmgfmkiousxceislfe` | `INACTIVE` (paused) | Unused duplicate. Holds a second copy of the same migrations and no traffic. Its REST endpoint does not answer at all. |

The `gami` project is a trap, not a spare. Pointing `VITE_SUPABASE_URL` at it would not raise an
error at build time and would not look broken in review — the client would simply fail every
request at runtime. The two projects have the same table names, so nothing in the code
distinguishes them.

Two qualifications, because the precise failure matters if you are debugging it:

- **This applies to the Supabase signup path.** `joinWaitlist()` in `gami-web/src/lib/sale.ts`
  tries `VITE_WAITLIST_API_URL` first and only falls through to Supabase when that is unset. It is
  unset in production today, so Supabase *is* the live path — but if that API is ever configured,
  `VITE_SUPABASE_URL` stops governing signups.
- **The failure is visible, not silent.** `joinWaitlistSupabase()` returns the error and
  `WaitlistForm` renders it to the user. Signups would be lost, and people would see them fail,
  which is a different (and more recoverable) problem than a form that appears to succeed.

Verified 2026-09-15: `https://etwmgfmkiousxceislfe.supabase.co/rest/v1/` returns no response
(`000`, connection refused) across repeated attempts, where a healthy project returns `401`.

If you want the duplicate gone, restore it first and diff its `public.waitlist` rows against the
live project — a paused project still holds its data, and deleting it discards anything that was
only ever written there.


## One-time database setup (required)

If the API returns `Could not find the table 'public.waitlist' in the schema cache`, the project has no waitlist tables yet.

**Recommended (2 minutes):**

1. Open https://supabase.com/dashboard/project/xetqhdzvbfeiedbmopew/sql/new  
2. Paste **`supabase/bootstrap_waitlist.sql`** → **Run**  
3. Wait ~10s → `npm run waitlist:status`

Automated alternatives: see **`docs/APPLY_WAITLIST_SCHEMA.md`**.

```bash
npm run waitlist:setup    # needs SUPABASE_ACCESS_TOKEN or DATABASE_URL
npm run waitlist:status   # probe REST + live stats RPC
```

## Client env (`gami-web/.env` / `.env.local`)

```bash
VITE_SUPABASE_URL=https://xetqhdzvbfeiedbmopew.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # legacy alias
VITE_SUPABASE_FUNCTIONS_URL=https://xetqhdzvbfeiedbmopew.supabase.co/functions/v1
```

## Server env (Edge Functions / gami-site API)

```bash
SUPABASE_URL=https://xetqhdzvbfeiedbmopew.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...            # never commit
SUPABASE_JWKS_URL=https://xetqhdzvbfeiedbmopew.supabase.co/auth/v1/.well-known/jwks.json
```

Server code uses `@supabase/server` (`withSupabase`, `createAdminClient`).

## Schema (TGE-ready)

Canonical SQL: **`supabase/bootstrap_waitlist.sql`** (mirrored in `supabase/migrations/20260721000000_waitlist_supabase_production.sql`).

| Object | Purpose |
|--------|---------|
| `waitlist` | Signups + wallet + TGE fields |
| `waitlist_stats` | Live counters (Realtime) |
| `waitlist_tge_ready` | Eligible wallets not yet distributed |
| `waitlist_distribution` | All valid 0x wallets |
| `waitlist_public_stats()` | Public RPC for `/waitlist/live` |
| `waitlist_alert_set()` | Subscribe/unsubscribe ops email alerts |

Key columns on `waitlist`:

| Column | Notes |
|--------|--------|
| `email` | unique |
| `full_name`, `company`, `role` | profile |
| `wallet_address` | TGE distribution (unique when set) |
| `referral_code` | `GAMI-XXXXXX` |
| `referred_by` | from `?ref=` |
| `status` | `pending` → `wallet_linked` / `eligible` / `distributed` |
| `eligible_for_tge` | auto-true when valid 0x wallet linked |
| `distributed_at`, `distribution_tx` | mark sent |

## Export wallets for TGE send

```bash
export SUPABASE_URL=https://xetqhdzvbfeiedbmopew.supabase.co
export SUPABASE_SECRET_KEY=sb_secret_...

npm run waitlist:export -- --format csv --out waitlist-wallets.csv
npm run waitlist:export:tge -- --out tge-participants.json
```

## Live waitlist updates

`/waitlist/live` uses Supabase Realtime on `waitlist_stats` (12s poll fallback).  
Each signup runs `bump_waitlist_stats` so totals stay accurate.

Ops email alerts: subscribe on the live page → `waitlist_alert_subscribers` via `waitlist_alert_set` → `waitlist-notify` + Resend.

## Edge functions (`@supabase/server`)

| Function | Auth mode |
|----------|-----------|
| `waitlist-join` | `publishable` |
| `waitlist-welcome` | `publishable` \| `secret` |
| `waitlist-admin` | `publishable` + `WAITLIST_ADMIN_SECRET` |
| `waitlist-notify` | Resend notifier (ops join/digest alerts) |
| `waitlist-raise-live` | Admin blast: email waitlist when raise goes live |

```bash
supabase secrets set SUPABASE_SECRET_KEY=sb_secret_...
supabase secrets set WAITLIST_ADMIN_SECRET=long-random-string
supabase secrets set RESEND_API_KEY=re_...

supabase functions deploy waitlist-join
supabase functions deploy waitlist-welcome
supabase functions deploy waitlist-admin
supabase functions deploy waitlist-notify
supabase functions deploy waitlist-raise-live
```

### Raise-live email blast

When the raise opens, notify waitlist members from `/admin`:

1. Apply `raise_live_notified_at` (migration `20260804160000_waitlist_raise_live_notified.sql` or re-run bootstrap)
2. Deploy `waitlist-raise-live`
3. Open `/admin` → **Dry run** → **Send raise-live emails**

API body: `{ "confirm": "raise is live", "dry_run": false }`. Skips rows with `raise_live_notified_at` set unless `"force": true`.

## App routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page with waitlist email CTA |
| `/waitlist` | Signup form + referral success |
| `/?ref=CODE` | Captures `referred_by` |
| `/admin` | Protected dashboard + raise-live blast |
| `/waitlist/live` | Live counter + email alerts (Supabase) |

## Join priority (`joinWaitlist`)

1. `VITE_WAITLIST_API_URL` (gami-site) if set  
2. **Supabase** when URL + publishable key are set  
3. Firebase (optional fallback)  
4. `waitlist-join` edge function  
