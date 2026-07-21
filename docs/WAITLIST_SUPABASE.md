# Waitlist (Supabase)

Production waitlist for `gami-web` uses **Supabase** as the primary backend.

## Client env (`gami-web/.env` / `.env.local`)

```bash
VITE_SUPABASE_URL=https://xetqhdzvbfeiedbmopew.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # legacy alias
VITE_SUPABASE_FUNCTIONS_URL=https://xetqhdzvbfeiedbmopew.supabase.co/functions/v1
```

## Server env (Edge Functions / gami-site API)

On hosted Supabase Edge Functions these are injected automatically. For local / Next.js:

```bash
SUPABASE_URL=https://xetqhdzvbfeiedbmopew.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...            # never commit; paste from API Keys
SUPABASE_JWKS_URL=https://xetqhdzvbfeiedbmopew.supabase.co/auth/v1/.well-known/jwks.json
```

Server code uses `@supabase/server` (`withSupabase`, `createAdminClient`). Do not use legacy `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` in new code.

Never commit service-role / secret keys. The publishable key is safe for the browser when RLS is enabled.

## Schema

Apply migrations (includes referrals + pending status + anon insert-only RLS):

```bash
supabase db push --project-ref YOUR_PROJECT_REF
# or run SQL in the Supabase SQL editor from:
# supabase/migrations/20260721000000_waitlist_supabase_production.sql
```

Key columns on `waitlist`:

| Column | Notes |
|--------|--------|
| `email` | unique |
| `full_name` | name |
| `company`, `role`, `country` | optional profile |
| `wallet_address` | TGE distribution |
| `referral_code` | own invite code `GAMI-XXXXXX` |
| `referred_by` | code from `?ref=` |
| `status` | `pending` default; `wallet_linked` when wallet set |

## Edge functions (`@supabase/server`)

Waitlist functions use `withSupabase` from `npm:@supabase/server`:

| Function | Auth mode |
|----------|-----------|
| `waitlist-join` | `publishable` |
| `waitlist-welcome` | `publishable` \| `secret` |
| `waitlist-admin` | `publishable` + `WAITLIST_ADMIN_SECRET` header |
| `waitlist-notify` | existing Resend notifier |

`supabase/config.toml` sets `verify_jwt = false` for these (required for publishable/secret modes).

```bash
supabase secrets set SUPABASE_SECRET_KEY=sb_secret_...   # if not auto-injected
supabase secrets set WAITLIST_ADMIN_SECRET=long-random-string
supabase secrets set RESEND_API_KEY=re_...

supabase functions deploy waitlist-join
supabase functions deploy waitlist-welcome
supabase functions deploy waitlist-admin
supabase functions deploy waitlist-notify
```

AI skill installed at `.agents/skills/supabase-server` via `npx skills add supabase/server`.

## App routes

| Route | Purpose |
|-------|---------|
| `/waitlist` | Signup form + referral success |
| `/?ref=CODE` | Captures `referred_by` |
| `/admin` | Protected dashboard (admin secret) |
| `/waitlist/live` | Optional Firebase live counter |

## Join priority (`joinWaitlist`)

1. `VITE_WAITLIST_API_URL` (gami-site) if set  
2. **Supabase** when URL + anon key are set  
3. Firebase (optional fallback)  
4. `waitlist-join` edge function  

## Future wallet / XP hooks

Waitlist rows are the genesis identity seed. Later:

- Link email → Privy wallet  
- Auto-create Gami profile  
- Award Genesis XP / onboarding quests  
- Mint Early Supporter NFT  
- Credit referral XP into the Universal Points Ledger  
