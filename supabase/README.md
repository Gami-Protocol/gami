# Gami Protocol — Supabase

## Waitlist

| Resource | Purpose |
|----------|---------|
| `waitlist` | Signups (email, name, company, role, wallet, referral codes, status) |
| `waitlist_distribution` | View of rows with valid `0x` wallets for TGE export |
| `waitlist_public_count()` | Public aggregate count RPC (no PII) |
| `waitlist-join` | Edge function: validate + upsert |
| `waitlist-welcome` | Confirmation email (Resend) |
| `waitlist-admin` | Protected admin stats / search / export |
| `waitlist-notify` | Ops live-count emails → `waitlist@gamiprotocol.io` |

See `docs/WAITLIST_SUPABASE.md` for the full client + RLS setup.

```bash
supabase db push
supabase functions deploy waitlist-join
supabase functions deploy waitlist-welcome
supabase functions deploy waitlist-admin
supabase functions deploy waitlist-notify
supabase functions deploy sale-eligibility
supabase functions deploy sale-stats
```

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
  npm run export:waitlist -- --format participants --out ./participants.json
```

### Secrets

```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set WAITLIST_ALERT_EMAILS=waitlist@gamiprotocol.io
supabase secrets set WAITLIST_ADMIN_SECRET=long-random-string
```

Subscribe at `/waitlist/live`. Alerts go to `waitlist@gamiprotocol.io` by default.
