# Waitlist (Supabase)

Production waitlist for `gami-web` uses **Supabase** as the primary backend.

## Client env (`gami-web/.env` / `.env.local`)

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_SUPABASE_FUNCTIONS_URL=https://YOUR_PROJECT.supabase.co/functions/v1
```

Never commit service-role keys. The anon / publishable key is safe for the browser when RLS is enabled.

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

## Edge functions

```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set WAITLIST_ADMIN_SECRET=long-random-string
supabase secrets set WAITLIST_ALERT_EMAILS=waitlist@gamiprotocol.io

supabase functions deploy waitlist-join
supabase functions deploy waitlist-welcome
supabase functions deploy waitlist-notify
supabase functions deploy waitlist-admin
```

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
