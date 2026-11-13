# Nova (gami-nova)

A second, standalone Gami site: a chat-only front end branded as "Nova."
Talking to Nova earns XP, which feeds a level bar and a points-based
leaderboard ("reward distribution"). No token or cash payout surface —
points only, by design, to stay clear of the sale/compliance surface on the
main `gami-web` site.

## Stack

Same as `gami-web`: Vite + React 19 + TypeScript + Tailwind. Deploys as its
own Vercel project via the root `vercel.json` (`outputDirectory:
gami-nova/dist`), so it can live on its own domain independently of
gamiprotocol.io.

## What's real vs. mocked

- **Real**: the chat UI, XP math (`src/lib/xp.ts`), level progression,
  localStorage persistence, the leaderboard UI and reward-share math.
- **Mocked**: Nova's replies (`src/lib/nova.ts` — canned responses, swap
  for a real model/agent call), and the other leaderboard entries
  (`src/lib/leaderboard.ts` — static peer list; swap for a real backend
  once one exists).

## Next steps (not built yet)

- Wire Nova's replies to an actual model or the Gami agent backend.
- Persist XP/leaderboard server-side (Supabase, matching `gami-web`'s
  stack) instead of localStorage, so it's shared across devices/users.
- Decide on branding details (domain, logo) beyond the placeholder "N" mark.

## Local dev

```
cd gami-nova
npm install
npm run dev
```
