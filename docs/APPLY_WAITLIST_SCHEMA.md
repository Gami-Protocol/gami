# Apply waitlist schema (required once)

Your Supabase project `xetqhdzvbfeiedbmopew` returns:

> Could not find the table 'public.waitlist' in the schema cache

That means the table was never created. The app cannot invent it from the publishable key alone.

## Fix (2 minutes)

1. Open **SQL Editor**:  
   https://supabase.com/dashboard/project/xetqhdzvbfeiedbmopew/sql/new
2. Paste the full contents of **`supabase/bootstrap_waitlist.sql`**
3. Click **Run**
4. Wait ~10 seconds (script includes `NOTIFY pgrst, 'reload schema'`)
5. Retry `/waitlist`

## What the bootstrap creates

| Object | Purpose |
|--------|---------|
| `public.waitlist` | Signups (email unique, name, company, role, wallet, referrals, status) |
| `waitlist_alert_subscribers` | Ops email alert opt-ins |
| `normalize_waitlist_row` trigger | Lowercases email/wallet, generates `GAMI-XXXXXX` |
| RLS | Anon/authenticated **INSERT only** (no public read of PII) |
| Grants | `INSERT` for `anon`/`authenticated`, full access for `service_role` |
| `waitlist_public_count()` | Public count RPC |
| `waitlist_distribution` / `waitlist_referral_leaderboard` | Views |

## Automated apply (optional)

```bash
# Personal access token from https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-waitlist-schema.mjs

# Or database password from Project Settings → Database
DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.xetqhdzvbfeiedbmopew.supabase.co:5432/postgres' \
  npm install pg --no-save && node scripts/apply-waitlist-schema.mjs
```

## After schema exists

Deploy edge functions (uses `@supabase/server`):

```bash
supabase functions deploy waitlist-join
supabase functions deploy waitlist-welcome
supabase functions deploy waitlist-admin
supabase functions deploy waitlist-notify
```

Set secrets: `SUPABASE_SECRET_KEY`, `WAITLIST_ADMIN_SECRET`, `RESEND_API_KEY`.
