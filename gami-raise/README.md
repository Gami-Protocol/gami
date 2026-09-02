# Gami Raise Platform

Production fundraising portal for Gami Protocol — ICO/token sale, TGE registration, waitlist, investor, partner, developer, and community onboarding.

## Stack

- Next.js 15 · React 19 · TypeScript · Tailwind CSS
- Privy (auth + embedded wallets) · wagmi/viem
- Prisma · PostgreSQL · Supabase-ready
- Framer Motion · React Three Fiber · GSAP
- TanStack Query · React Hook Form · Zod

## Quick start

```bash
cd gami-raise
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Set `NEXT_PUBLIC_PRIVY_APP_ID` (defaults to the public Gami App ID) and `DATABASE_URL` for persistence.

## Key routes

| Route | Purpose |
|---|---|
| `/` | Home |
| `/raise` | Raise onboarding flow |
| `/waitlist` | Email/wallet waitlist |
| `/token` | Tokenomics + utility surfaces |
| `/ico` | ICO overview |
| `/tge` | TGE countdown |
| `/dashboard` | Participant dashboard |
| `/partners` `/developers` `/investors` | Stakeholder portals |
| `/admin` | Operations console |

## Notes

- Contributions stay gated by `NEXT_PUBLIC_SALE_LIVE=false` until launch.
- Waitlist API supports dry-run mode when `DATABASE_URL` is unset.
- Deploy on Vercel with Edge-friendly health checks at `/api/health`.
