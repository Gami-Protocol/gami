# Unified Gami Identity + `.gami` DNS

One account across three surfaces: the marketing waitlist (`gami-site`), the
token sale (`gami-web`), and the Gami Wallet app (`gami-wallet` repo).

## The problem this solves

Before this, joining the waitlist on the web and signing up in the wallet
created two unrelated records. A buyer had to copy a hex address between a
browser and a phone to receive the tokens they had just bought.

## How it works

**Identity is keyed on the normalized email.** Every surface calls the same
entry point, so the second signup merges into the first row instead of creating
a new one — the referral code, waitlist position, and `.gami` name all survive.

```
gami-site  /api/waitlist  ─┐
gami-web   sale signup    ─┼─►  upsert_gami_identity(email, …)  ─►  public.waitlist (one row)
gami-wallet onboarding    ─┘                │
                                            └─►  claim_gami_dns(handle, …)  ─►  public.gami_dns_names
```

### Database (`supabase/migrations/20260831120000_gami_identity_dns.sql`)

| Object | Purpose |
| --- | --- |
| `waitlist.gami_handle` / `gami_dns_name` | The name this identity owns |
| `waitlist.signup_surface` | Which product they arrived from first (never overwritten) |
| `waitlist.wallet_app_linked_at` | Set once the wallet app links this identity |
| `gami_dns_names` | The `.gami` registry — one name per email, one per address |
| `gami_dns_reserved_handles` | Brand/impersonation-risk names nobody may claim |
| `upsert_gami_identity(...)` | **The shared signup entry point.** Returns `created` so only genuinely new signups get a welcome email |
| `claim_gami_dns(...)` | Atomic reserve/rebind. Re-claiming your own name is a no-op |
| `resolve_gami_dns(name)` | `foo.gami` → address (public) |
| `reverse_gami_dns(address)` | address → `foo.gami` (public) |
| `is_gami_handle_available(handle)` | Live check for the signup forms (public) |

A name is `reserved` until an EVM address binds to it, then `active` and
resolvable. `claim_gami_dns` and `upsert_gami_identity` are `service_role` only,
so captcha and rate limiting stay enforceable at the HTTP edge.

### HTTP surface

Next.js routes in `gami-site` (`/api/v1/...`) and the equivalent Supabase edge
functions (`gami-identity`, `gami-dns`):

| Route | Use |
| --- | --- |
| `POST /api/v1/identity` | Unified signup / sign-in |
| `GET  /api/v1/dns/resolve?name=` | Name → address |
| `GET  /api/v1/dns/resolve?address=` | Address → name (reverse) |
| `GET  /api/v1/dns/availability?handle=` | Live availability |
| `POST /api/v1/dns/claim` | Bind `handle.gami` → wallet |
| `POST /api/v1/wallets/register` | Link a device wallet to the identity |

Point the wallet's `EXPO_PUBLIC_GAMI_API_BASE` at `https://gamiprotocol.io/api`
(or wherever `gami-site` is deployed) to share one backend.

## Getting GAMI into the wallet after a purchase

1. At signup — on the site or the sale page — the buyer claims `you.gami`.
2. The name binds to their wallet address, so it resolves on-chain lookups.
3. `GamiDeliveryCard` on the sale page shows the name their allocation is
   delivered to, plus a deep link (`gami://receive?name=you.gami`) that opens
   the wallet on the receive screen.
4. Signing into the wallet with the **same email** merges into the same
   identity, and the `.gami` name comes with it.

No hex address is ever copied between devices.

## Applying the migration

```bash
supabase db push
# or paste supabase/migrations/20260831120000_gami_identity_dns.sql into the SQL editor
```

The migration is idempotent and backfills `signup_surface` and
`wallet_linked_at` for existing rows.
