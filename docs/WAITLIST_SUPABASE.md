# Waitlist (Supabase)

Production waitlist for `gami-web` uses **Supabase** as the primary backend.

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
| `waitlist-notify` | Resend notifier |

```bash
supabase secrets set SUPABASE_SECRET_KEY=sb_secret_...
supabase secrets set WAITLIST_ADMIN_SECRET=long-random-string
supabase secrets set RESEND_API_KEY=re_...

supabase functions deploy waitlist-join
supabase functions deploy waitlist-welcome
supabase functions deploy waitlist-admin
supabase functions deploy waitlist-notify
```

## App routes

| Route | Purpose |
|-------|---------|
| `/waitlist` | Signup form + referral success |
| `/?ref=CODE` | Captures `referred_by` |
| `/admin` | Protected dashboard (admin secret) |
| `/waitlist/live` | Live counter + email alerts (Supabase) |

## Join priority (`joinWaitlist`)

1. `VITE_WAITLIST_API_URL` (gami-site) if set  
2. **Supabase** when URL + publishable key are set  
3. Firebase (optional fallback)  
4. `waitlist-join` edge function  
