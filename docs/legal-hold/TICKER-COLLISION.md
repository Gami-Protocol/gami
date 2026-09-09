# Board escalation — the GAMI ticker is already taken

**Prepared:** 9 September 2026
**Decision needed:** before any token work resumes
**Owner:** board

> Factual summary prepared by engineering. Not legal advice. The claims below
> about the third-party project are as reported in the remediation brief and
> should be verified from primary sources before the board acts on them.

## The situation

`$GAMI` is reported to be an existing, listed token. GAMI World — a BSC gaming
launchpad — ran public IDOs across multiple launchpads, publishes a GitBook
whitepaper, and trades under the GAMI ticker on MEXC.

**Verify before deciding:** confirm the current listing status, the trading
venues, the issuing entity, and any registered trade marks in the UK, EU and US.
None of that has been checked here.

## Why it matters

1. **The ticker is taken.** A second `$GAMI` produces market confusion,
   exchange-listing friction, and holders buying the wrong asset.
2. **Diligence finds them first.** They have years of indexed history. A search
   for "GAMI token" surfaces a 2021 BSC launchpad, not Gami Protocol.
3. **Their model resembles what we published.** Their token uses
   staking-for-tiers mechanics — the same shape as the *"Stake to multiply XP"*
   copy that was live on our homepage. An investor comparing the two may
   reasonably assume Gami Protocol is a relaunch of it.

## The options

| Option | Cost now | Cost after a TGE |
|---|---|---|
| Different ticker | A rename across surfaces | — |
| Different product name | Rebrand: domain, marks, collateral | — |
| Documented coexistence position from counsel | Counsel time | Unbounded — confusion is permanent and listings are hard to unwind |

Renaming is cheap while nothing is issued. It stops being cheap the moment an
asset exists that holders can buy under the wrong name.

## Recommendation

Take a decision this week, before any token work resumes. If the direction is
coexistence, get it in writing from counsel first. Until a decision is made,
`$GAMI` stays out of every publishable surface — which the CI gate now enforces.

## Related

- `docs/legal-hold/COUNSEL-BRIEFING.md` — the withdrawn token-sale surface.
- `scripts/forbidden-phrases.json` — the enforced exclusion.
