# Supabase (Gami ICO backend)

## Waitlist / TGE wallets

| Object | Role |
|--------|------|
| `waitlist` | Stores signup email, name, wallet, referral, source, status |
| `waitlist_distribution` | View of rows with valid `0x` wallets for TGE export |
| `waitlist-join` | Edge function: validate, normalize, upsert waitlist rows |
| `sale_participants` | Post-KYC contributors (allocation source of truth) |

### Deploy

```bash
supabase db push
supabase functions deploy waitlist-join
supabase functions deploy sale-eligibility
supabase functions deploy sale-stats
```

### Export for TGE

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
  npm run export:waitlist -- --format participants --out ./participants.json
```
