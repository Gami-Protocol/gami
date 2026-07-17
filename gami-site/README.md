# Gami Protocol Website (v2)

Premium marketing site for [gamiprotocol.io](https://gamiprotocol.io).

## Stack

- Next.js 15 · React 19 · TypeScript · Tailwind CSS 4
- Framer Motion · GSAP · Three.js (hero)
- Vercel AI SDK · Supabase · Drizzle schema · Resend · PostHog · Turnstile

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home — hero, Ask Gami AI, wallet, partners, developers, AI, chains, token, roadmap |
| `/wallet` | Wallet download |
| `/developers` | SDK + docs |
| `/partners` | Partner program |
| `/ai` | AI + chat |
| `/roadmap` | Timeline |
| `/waitlist` | Conversion form → Supabase + email alerts |

## Setup

```bash
cd gami-site
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

### Required for waitlist

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
WAITLIST_ALERT_EMAILS=waitlist@gamiprotocol.io
```

Apply `supabase/migrations/20260717150000_waitlist_extended.sql` (or the monorepo waitlist migrations).

### Required for Ask Gami AI

```
OPENAI_API_KEY=
```

## Deploy (Vercel)

1. Root Directory = `gami-site`
2. Framework = Next.js
3. Add env vars from `.env.example`
