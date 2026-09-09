# Legal hold — token-sale surface on gamiprotocol.io

**Archived:** 2026-09-09
**Reason:** Preservation before withdrawal of a publicly indexed token-sale funnel.
**Do not delete or rewrite.** This directory is the evidentiary record of what was
published and when. It is source-only: it contains no live routes and is excluded
from the build.

## Withdrawn routes

| Route | Component | First committed | Last modified | Sitemap entry at archive time |
|---|---|---|---|---|
| `/sale` | `SalePage.tsx` | 2026-07-11 (`704a5f2`) | 2026-08-04 (`f7c41a1`) | priority 0.8, weekly |
| `/sale/contribute` | `ContributePage.tsx` | 2026-07-11 (`704a5f2`) | — | not listed (robots-disallowed) |
| `/sale/kyc` | `KycPage.tsx` | 2026-07-11 (`704a5f2`) | — | not listed (robots-disallowed) |
| `/tokenomics` | `TokenomicsPage.tsx` | 2026-07-11 (`704a5f2`) | 2026-07-16 (`ca45656`) | priority 0.8, monthly |
| `/whitepaper` | `WhitepaperPage.tsx` | 2026-07-11 (`704a5f2`) | 2026-07-16 (`ca45656`) | priority 0.7, monthly |
| `/legal/risk` | `legal/RiskPage.tsx` | 2026-07-11 (`704a5f2`) | 2026-07-11 (`704a5f2`) | priority 0.3, yearly |
| `/claim` | `ClaimPage.tsx` | 2026-07-11 (`704a5f2`) | — | not listed (robots-disallowed) |

All routes were served with `<meta name="robots" content="index, follow, max-image-preview:large">`
and were reachable from `https://gamiprotocol.io/sitemap.xml`.

## Exposure window

- **Publication:** 2026-07-11 (`704a5f2`, first commit of the route set).
- **Sitemap listing:** 2026-07-25 (`fbe10a8`, first commit of `public/sitemap.xml`).
- **Withdrawal:** 2026-09-09 (this change).
- **Approximate indexed window:** ~8 weeks for the routes, ~6 weeks for sitemap-advertised
  crawl priority.

Deployment is continuous from `main` via Vercel (root `vercel.json`,
`outputDirectory: gami-web/dist`), so commit dates approximate publication dates.
The precise deploy timestamps are in the Vercel deployment log for the project and
should be exported alongside this archive.

## Homepage copy at archive time

Meta and Open Graph description, served on every route via `index.html` and
`src/components/Seo.tsx`:

> Earn XP, rewards, and tokens across apps and games using Gami Protocol's
> AI-powered gamification engine.

Homepage body copy (`HomePage.tsx`), verbatim:

> Earn XP, rewards, and tokens across apps, games, and communities with one
> universal wallet powered by AI agents and blockchain infrastructure.

> $GAMI is an omnichain token settling from Base, bridgeable wherever partners need it.

> $GAMI — Omnichain token settling from Base — governance, staking, protocol fees,
> and treasury coordination.

> Sign in or sign up to start earning XP, quests, and $GAMI rewards across every
> connected platform.

JSON-LD `FAQPage` block in `index.html`:

> Join at https://gamiprotocol.io/waitlist with your email (and optional wallet)
> for priority access to the $GAMI launch, multipliers, and updates.

> The Gami Wallet is the user app for XP, quests, badges, staking, and cross-app rewards.

## Note on divergence from the reported live copy

The remediation brief quotes indexed homepage strings that are **not present at this
commit**: "Join the Gami token launch and help build the universal rewards economy",
"Stake to multiply XP and govern the protocol", and "View Launch". Commit `2f34e5b`
("Simplify landing site CTAs: dashboard sign-in replaces waitlist") replaced the
waitlist/launch CTAs before this archive was taken. Those strings are therefore
recoverable only from pre-`2f34e5b` history and from search-engine caches — they are
not in the working tree. Retrieve them with:

    git show 2f34e5b^:gami-web/src/pages/HomePage.tsx
    git show 2f34e5b^:gami-web/index.html

and capture the Google cache and Wayback Machine copies before they roll over.

## Contents

- `source/` — verbatim copies of every file backing the withdrawn routes.
- `SHA256SUMS.txt` — checksums for each archived file.

## Still required (cannot be done from the repository)

1. Export the Vercel deployment log for exact publication timestamps.
2. Capture Wayback Machine and Google cache copies of the four URLs.
3. Screenshot each route as rendered, before the deploy that withdraws them.
4. Request removal in Google Search Console for the four URLs.
