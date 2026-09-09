# Counsel briefing — withdrawn token-sale surface on gamiprotocol.io

**Prepared:** 9 September 2026
**Prepared by:** engineering, at the direction of the site remediation brief
**Status:** the pages described below were taken offline on 9 September 2026

> This briefing is a factual record assembled by engineers. It is not legal
> advice and contains no legal conclusions. It exists so that counsel can reach
> their own.

---

## 1. What was published

Between **11 July 2026** and **9 September 2026**, `gamiprotocol.io` served a
complete token-sale funnel. Every page carried
`<meta name="robots" content="index, follow, max-image-preview:large">` and was
advertised in `https://gamiprotocol.io/sitemap.xml` from **25 July 2026**.

| URL | What it was | Sitemap priority |
|---|---|---|
| `/sale` | Token sale page with a contribution flow | 0.8, weekly |
| `/sale/contribute` | Contribution form (USDC, card via Coinbase) | not listed |
| `/sale/kyc` | Identity verification gate for contributions | not listed |
| `/tokenomics` | Supply, allocation, vesting, burn engine | 0.8, monthly |
| `/whitepaper` | Protocol and tokenisation paper | 0.7, monthly |
| `/legal/risk` | Risk disclosure for the offering | 0.3, yearly |
| `/claim` | Vested-token claim after TGE | not listed |

Two further indexed pages carried offering material without being part of the
funnel:

- **`/waitlist`** (priority 0.9) — titled *"GAMI ICO Launchpad — $GAMI
  Tokenomics & Genesis"*, describing *"Fixed 1B supply. 40% community.
  XP-driven emissions. Join the waitlist for priority allocation in the $GAMI
  ICO and permanent multipliers."*
- **`/wallet/guide`** (priority 0.8) — *"invest £100–£10,000"*, with a live
  `$GAMI` allocation calculation.

`/legal/terms` was headed **"Terms of Token Sale"** and stated that *"Tokens
purchased in the sale are subject to vesting schedules disclosed at purchase."*
`/legal/privacy` stated that KYC data was collected *"to operate the token
sale."*

## 2. Amounts and jurisdiction

The contribution flow presented a stated range of **£100 to £10,000** per
contributor, denominated in GBP, with payment accepted in USDC and by card. A
geo-blocking hook (`useGeoBlock`) and a KYC gate were present in the code. **We
have not established whether any contribution was ever accepted, from whom, or
in what jurisdiction.** That question needs to be answered from the payment
processor and Supabase records, not from the site source, and it is the first
thing we suggest establishing.

## 3. Why this is being raised now

The site's copy was directed at UK consumers, priced in sterling, and reachable
without restriction. Our understanding — which counsel should verify rather than
accept — is that the UK cryptoasset financial promotions regime is in force now,
ahead of the wider regime commencing 25 October 2027, and that a promotion of
this kind must be made or approved by an appropriately authorised firm.
**No authorised firm approved this material.** We are not in a position to judge
whether the material constitutes a financial promotion, and we are not asserting
that it does.

Separately, the phrase *"Stake to multiply XP and govern the protocol"* appeared
in indexed homepage copy. It is not in the current source — commit `2f34e5b`
replaced it before this work began — but it is recoverable from search-engine
caches. We flag it because it links a return to staking and attaches governance
to the asset.

## 4. What has been done

1. **Preserved first.** `docs/legal-hold/2026-09-09-token-sale-surface/` holds
   verbatim copies of every file backing the withdrawn routes, SHA-256
   checksums, the homepage copy as published, and the exposure window. Nothing
   was deleted before the archive was in place.
2. **Withdrawn.** All seven routes now return `410 Gone`. They were not
   redirected, which would have carried their inbound signal elsewhere, and not
   404'd, which reads as possibly temporary.
3. **De-indexing.** Removed from `sitemap.xml`; `Disallow`ed for all agents
   except Googlebot, deliberately, so Google can fetch the 410 and drop them.
4. **Offering language removed** from `/waitlist`, `/wallet/guide`,
   `/legal/terms`, `/legal/privacy`, the homepage, the JSON-LD that Google and
   AI assistants consume, and `llms.txt`.
5. **Regression-proofed.** CI fails if any of these routes returns anything but
   410, appears in a sitemap, is linked from any page, or if forbidden phrasing
   reappears in the rendered DOM of any route.

## 5. What we need from counsel

1. Whether the withdrawn material constituted a financial promotion, and if so
   what follows from it having been communicated without approval.
2. Whether any notification to the FCA is required or advisable, and on what
   timeline.
3. Whether any contributions were accepted, and if so what is owed to whom.
   (We can produce the payment and database records; we have not yet done so.)
4. Whether `/legal/terms` and `/legal/privacy` as now redrafted are adequate, or
   should be replaced with counsel-drafted versions. They are currently marked
   as working drafts pending review.
5. A written position on the `GAMI` ticker collision described in
   `docs/legal-hold/TICKER-COLLISION.md`.
6. Written clearance before any of the withdrawn routes returns in any form.

## 6. Attachments

- `docs/legal-hold/2026-09-09-token-sale-surface/MANIFEST.md` — full inventory,
  dates, and the published copy verbatim.
- `docs/legal-hold/2026-09-09-token-sale-surface/source/` — the pages as served.
- `docs/legal-hold/2026-09-09-token-sale-surface/SHA256SUMS.txt`.
- `docs/legal-hold/TICKER-COLLISION.md`.

## 7. Still outstanding

These require someone with account access and cannot be done from the repository:

- [ ] Export the Vercel deployment log for exact publication timestamps.
- [ ] Capture Wayback Machine and Google cache copies of all seven URLs.
- [ ] Screenshot each route as rendered, from a pre-withdrawal deployment.
- [ ] Request removal in Google Search Console for the four indexed URLs.
- [ ] Establish from payment and database records whether any contribution was
      accepted, and from which jurisdictions.
- [ ] Send this briefing to counsel.
