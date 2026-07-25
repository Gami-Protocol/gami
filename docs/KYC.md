# Identity verification (KYC)

Contributions stay disabled until `sale_participants.kyc_status = 'approved'`.

## Built-in flow (default)

1. User opens `/sale/contribute` or `/sale/kyc`
2. Fills identity form + compliance attestations
3. Signs a wallet message proving ownership
4. `kyc-submit` edge function:
   - Rejects restricted jurisdictions
   - Stores a `kyc_applications` row (document number hashed)
   - Upserts `sale_participants.kyc_status`
5. User confirms eligibility and can contribute when the sale is live

### Auto-approve vs manual review

| Supabase secret | Behavior |
|-----------------|----------|
| unset / `KYC_REQUIRE_MANUAL_REVIEW=false` | Valid submissions are **auto-approved** (good for sandbox / pre-launch) |
| `KYC_REQUIRE_MANUAL_REVIEW=true` | Status stays `pending` until ops approve in `/admin` → KYC queue |

## Deploy backend

```bash
# From repo root
supabase db push
# or apply migration:
# supabase/migrations/20260725120000_kyc_applications.sql

supabase functions deploy kyc-submit
supabase functions deploy kyc-review
supabase functions deploy kyc-webhook
supabase functions deploy sale-eligibility

supabase secrets set KYC_REQUIRE_MANUAL_REVIEW=false
# For production compliance reviews:
# supabase secrets set KYC_REQUIRE_MANUAL_REVIEW=true
# supabase secrets set KYC_ADMIN_SECRET=your-long-secret
```

Frontend only needs existing Supabase URL + anon/publishable key (`VITE_SUPABASE_*`).

## Hosted providers (optional)

If you later enable Persona / Sumsub / Synaps:

1. Set `VITE_KYC_VERIFICATION_URL` (supports `{wallet}`)
2. Point the provider webhook to `.../functions/v1/kyc-webhook`
3. Sign payloads with `KYC_WEBHOOK_SECRET` (`x-kyc-signature: sha256=...`)

The contribute UI shows **Open hosted KYC provider** when the URL is set, in addition to the builtin form.

## Admin review

1. Open `/admin`
2. Unlock with `WAITLIST_ADMIN_SECRET` or `KYC_ADMIN_SECRET`
3. Open **KYC queue**
4. Approve / reject pending applications

## API summary

| Function | Method | Purpose |
|----------|--------|---------|
| `kyc-submit` | POST | Builtin application + wallet signature |
| `kyc-review` | GET/POST | Admin list + approve/reject |
| `kyc-webhook` | POST | External provider status sync |
| `sale-eligibility` | POST | Returns `kyc_status` for a wallet |
