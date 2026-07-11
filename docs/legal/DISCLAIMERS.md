# Gami Protocol — Legal & Compliance Framework

> **Important:** This document is a technical compliance checklist, not legal advice. Engage qualified securities counsel before any token sale.

## Sale Structure Recommendations

1. **International participants:** Reg S-style offshore offering with geo-restrictions
2. **US participants:** SAFT for accredited investors only, or full geo-block
3. **KYC/AML:** Required for all contributions above $1,000 USD equivalent

## Geo-Restrictions (Default Block List)

Block wallet connections and KYC from:

- United States (unless SAFT accredited flow enabled)
- OFAC-sanctioned jurisdictions (Cuba, Iran, North Korea, Syria, Crimea)
- Countries with explicit crypto sale bans (updated quarterly)

## Required Documents Before Public Sale

- [ ] Terms of Token Sale
- [ ] Risk Factors Disclosure
- [ ] Privacy Policy (GDPR + CCPA compliant)
- [ ] Whitepaper disclaimer (not a securities offering document)
- [ ] KYC/AML policy
- [ ] Cookie policy (gami-web)

## KYC Provider Options

| Provider | Integration | Notes |
|----------|-------------|-------|
| Persona | SDK + webhook | Recommended for US compliance |
| Sumsub | SDK + webhook | Strong EU coverage |
| Synaps | Webhook | Lightweight crypto-native |

## Compliance Implementation

- `gami-web` enforces geo-block via IP + wallet region signals
- `TokenSale.sol` uses Merkle whitelist for private phase
- `sale_participants.kyc_status` must be `approved` before contribution
- All transactions logged with wallet address, amount, timestamp, jurisdiction

## Counsel Engagement Checklist

- [ ] Retain securities counsel (US + offshore)
- [ ] Obtain legal opinion on token classification
- [ ] Review smart contract terms of sale
- [ ] File required registrations (if any) per jurisdiction
- [ ] Establish entity structure (foundation / DAO / corp)
