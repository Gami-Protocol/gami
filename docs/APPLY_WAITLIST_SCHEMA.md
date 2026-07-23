# Apply waitlist schema (required once)

Your Supabase project `xetqhdzvbfeiedbmopew` returns:

> Could not find the table 'public.waitlist' in the schema cache

That means the table was never created. The publishable key cannot create tables — apply SQL once.

## Fix (2 minutes) — recommended

1. Open **SQL Editor**:  
   https://supabase.com/dashboard/project/xetqhdzvbfeiedbmopew/sql/new
2. Paste the full contents of **`supabase/bootstrap_waitlist.sql`**
3. Click **Run** (success = green)
4. Wait ~10 seconds (`NOTIFY pgrst, 'reload schema'` is included)
5. Verify:

```bash
npm run waitlist:status
```

6. Retry `/waitlist` and `/waitlist/live`

## What the bootstrap creates

| Object | Purpose |
|--------|---------|
| `public.waitlist` | Signups + wallet + TGE fields (`eligible_for_tge`, `distributed_at`, `distribution_tx`) |
| `public.waitlist_stats` | Singleton live counters (Realtime-enabled) |
| `waitlist_alert_subscribers` | Ops email alert opt-ins |
| `normalize_waitlist_row` | Lowercases email/wallet, generates `GAMI-XXXXXX` |
| `bump_waitlist_stats` | Keeps live totals in sync on every insert/update |
| RLS | Anon/authenticated **INSERT only** on waitlist (no public PII reads) |
| `waitlist_public_count()` / `waitlist_public_stats()` | Public RPCs for marketing + live page |
| `waitlist_tge_ready` | Approved + walleted + eligible rows for airdrop / TGE |
| `waitlist_distribution` | Broader wallet export view |
| `waitlist_referral_leaderboard` | Top referrers |

## Automated apply (optional)

```bash
# Personal access token — https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN=sbp_... npm run waitlist:setup

# Or database password — Project Settings → Database
DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.xetqhdzvbfeiedbmopew.supabase.co:5432/postgres' \
  npm install pg --no-save && npm run waitlist:setup
```

## After schema exists — TGE wallet export

Set secret key (Dashboard → Settings → API Keys → Secret):

```bash
export SUPABASE_URL=https://xetqhdzvbfeiedbmopew.supabase.co
export SUPABASE_SECRET_KEY=sb_secret_...

# CSV of everyone with a wallet
npm run waitlist:export -- --out waitlist-wallets.csv

# TGE-ready only (approved + eligible + wallet) as merkle participants JSON
npm run waitlist:export:tge -- --out tge-participants.json
```

## After schema exists — edge functions + live alerts

```bash
supabase functions deploy waitlist-join
supabase functions deploy waitlist-welcome
supabase functions deploy waitlist-admin
supabase functions deploy waitlist-notify
```

Secrets: `SUPABASE_SECRET_KEY`, `WAITLIST_ADMIN_SECRET`, `RESEND_API_KEY`, `WAITLIST_FROM_EMAIL`.

## Live waitlist updates

Once `waitlist_stats` exists and is in the `supabase_realtime` publication:

- `/waitlist/live` subscribes via Supabase Realtime (falls back to 12s polling)
- Each signup bumps totals through the `bump_waitlist_stats` trigger
- No Firebase required when Supabase is configured
