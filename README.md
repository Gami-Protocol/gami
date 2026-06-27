# GAMI Protocol

**GAMI** is a gamified Web3 mobile wallet and rewards protocol. Users earn XP and $GAMI tokens by completing quests, performing on-chain actions, and engaging with the app daily. Progress is tracked through a levelling system, a badge collection, and a leaderboard — with an AI assistant called **NOVA** available to help users navigate their wallet at any time.

[![Built with Bilt](https://img.shields.io/endpoint?url=https%3A%2F%2Fapp.bilt.me%2Fapi%2Fbadge)](https://bilt.me)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Gamification System](#gamification-system)
  - [XP & Levels](#xp--levels)
  - [Quests](#quests)
  - [Badges](#badges)
  - [$GAMI Token](#gami-token)
- [NOVA AI Assistant](#nova-ai-assistant)
- [Architecture](#architecture)
- [Linting & Formatting](#linting--formatting)
- [Deployment](#deployment)

---

## Features

- **XP & Levels** — earn experience points on every action; level up along a quadratic progression curve
- **Quests** — curated on-chain and off-chain tasks (swaps, NFT mints, referrals, streaks, and more) that pay out XP on completion
- **$GAMI Token** — a native token balance derived from accumulated XP, transferable via the Send / Receive flow
- **Universal Points** — soulbound (non-transferable) XP that can be redeemed for in-protocol rewards
- **Badges** — 24 collectible badges that unlock at XP milestones, shown on the Profile / Stash screen
- **NOVA** — an in-app AI chat assistant powered by Anthropic Claude (via a Supabase Edge Function) with a scriptable offline fallback; personality is configurable (shy / chill / hype)
- **Privy embedded wallet** — passkey-native auth and embedded EVM wallet so users never need to manage seed phrases
- **QR code scanner** — scan another user's wallet address to pre-fill the Send flow
- **Leaderboard rank** — global rank derived from XP

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 54, New Architecture) |
| Language | TypeScript 5 |
| Navigation | [Expo Router](https://expo.github.io/router/) v6 (file-based) |
| UI library | [HeroUI Native](https://www.heroui.com/) + [Tailwind CSS](https://tailwindcss.com/) via [Uniwind](https://github.com/uni-wind/uniwind) |
| State management | [Zustand](https://github.com/pmndrs/zustand) with `persist` middleware (AsyncStorage) |
| Auth & wallet | [Privy](https://privy.io/) embedded wallet (`@privy-io/expo`) |
| Backend | [Supabase](https://supabase.com/) (Postgres + Edge Functions) |
| AI assistant | [Anthropic Claude](https://www.anthropic.com/) via Supabase Edge Function `nova-chat` |
| Lists | [@shopify/flash-list](https://shopify.github.io/flash-list/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Analytics | [PostHog](https://posthog.com/) |
| On-chain | [viem](https://viem.sh/) + ethers shims |
| Linter | [oxlint](https://oxc.rs/docs/guide/usage/linter) |
| Formatter | [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) |

---

## Project Structure

```
gami/
├── app/                    # Expo Router file-based routes
│   ├── (app)/              # Authenticated app screens
│   │   ├── home.tsx        # Dashboard — balance, XP, quick actions
│   │   ├── quests.tsx      # Quest list with claim lifecycle
│   │   ├── badges.tsx      # Badge collection / stash
│   │   ├── profile.tsx     # User profile
│   │   ├── nova.tsx        # NOVA AI chat
│   │   ├── send.tsx        # Send $GAMI
│   │   ├── receive.tsx     # Receive — show QR code
│   │   ├── scan.tsx        # QR code scanner
│   │   └── settings.tsx    # App settings
│   └── (onboarding)/       # Onboarding flow screens
├── components/
│   └── gami/               # Design-system components (GCard, GButton, …)
├── lib/
│   ├── config.ts           # Earn rules, interests, avatar palette, quests, badges
│   ├── gami-sdk.ts         # Local mock of @gami/wallet-sdk (XP math, wallet, envelopes)
│   ├── store.ts            # Zustand onboarding + app state
│   ├── nova.ts             # NOVA scripted brain + live Claude bridge
│   ├── auth.ts             # Auth helpers
│   ├── privy.ts            # Privy client setup
│   ├── supabase.ts         # Supabase client setup
│   └── utils.ts            # Shared utilities
├── supabase/               # Supabase Edge Functions & migrations
├── assets/                 # App icon, fonts, images
├── app.config.ts           # Expo config (reads env vars)
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 10 — install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Expo Go** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), or a simulator/emulator

### Environment Variables

Create a `.env.local` file in the project root (never commit it). The following variables are required for full functionality:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>

# Privy embedded wallet
EXPO_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
EXPO_PUBLIC_PRIVY_CLIENT_ID=<your-privy-client-id>
```

> **Note:** The app runs without these variables in a "mock" mode — Supabase calls are skipped and NOVA falls back to its scripted brain. This is useful for local UI development.

### Running the App

```sh
# 1. Clone the repository
git clone https://github.com/Gami-Protocol/gami.git
cd gami

# 2. Install dependencies
npm install

# 3. Start the Expo development server
npx expo start
```

Scan the QR code printed in the terminal with **Expo Go** on your phone.

To run on a native simulator/emulator:

```sh
# iOS (macOS + Xcode required)
npm run ios

# Android (Android Studio + emulator required)
npm run android
```

---

## Gamification System

### XP & Levels

XP follows a **quadratic progression curve**. The cumulative XP required to reach level `n` is:

```
xpForLevel(n) = 500n + 250n(n − 1)
```

| Level | Cumulative XP needed |
|---|---|
| 1 | 500 |
| 2 | 1 500 |
| 5 | 7 500 |
| 10 | 27 500 |
| 20 | 107 500 |

The XP math lives in `lib/gami-sdk.ts` (`xpForLevel`, `levelForXP`, `statsFromXP`).

### Quests

Quests are defined in `lib/config.ts` (`QUESTS`). Each quest has a reward in XP that is claimed through the **outbox envelope** pattern:

1. The user taps **Complete** → a `ChainActionEnvelope` with status `queued` is created immediately.
2. XP is applied **optimistically** to the local store.
3. The envelope advances `queued → settling → settled` (simulated supervisor; real `gami-agent` in production).
4. The UI reflects each status transition in real time.

**Available quests:**

| Quest | Tag | Reward |
|---|---|---|
| First Swap | DEFI | +500 XP |
| Daily Check-in | STREAK | +100 XP |
| Mint Mondays | NFTs | +250 XP |
| Bring a Friend | SOCIAL | +500 XP |
| Spread the Word | CREATOR | +50 XP |
| Cross the Bridge | MULTI-CHAIN | +300 XP |

### Badges

24 collectible badges unlock at XP milestones, ranging from **Starter** (0 XP) to **Gami God** (40 000 XP). Badges are soulbound — they represent achievement, not transferable value. The full list is in `lib/config.ts` (`BADGES`).

### $GAMI Token

The $GAMI balance is derived from total XP:

```
gamiBalance = max(0, totalXP × 0.002 − spentGami)
```

Users can **Send** $GAMI to any wallet address (QR or manual entry) and **Receive** by sharing their address QR code.

---

## NOVA AI Assistant

NOVA is GAMI's in-app AI assistant. It has three configurable personalities set during onboarding:

| Tone | Description |
|---|---|
| `shy` | Quiet and reserved; helpful when asked |
| `chill` | Relaxed and informative (default) |
| `hype` | Energetic and enthusiastic |

**How NOVA works:**

1. User sends a message in the Nova screen.
2. The app calls the `nova-chat` Supabase Edge Function with the conversation history, the user's chosen tone, and a wallet context payload (level, XP, balance, interests).
3. The Edge Function forwards the request to **Anthropic Claude** and returns a reply.
4. If the Edge Function is unreachable (offline, missing config), NOVA falls back to a scripted rule-based brain in `lib/nova.ts` that reads live wallet state from the Zustand store.

**Example questions NOVA can answer:**
- "What's my level?"
- "Find me a quest"
- "What's my $GAMI balance?"
- "How do I earn XP?"

---

## Architecture

### State management

All user state (XP, level, wallet address, settings, onboarding progress) is stored in a single **Zustand** store (`lib/store.ts`) persisted to `AsyncStorage` under the key `gami-onboarding`.

Server-side profile rows in Supabase are synced to the store via `hydrateFromProfile` on login.

### Wallet SDK

`lib/gami-sdk.ts` is a **local mock** of the planned `@gami/wallet-sdk` package. Its public API mirrors the documented SDK surface so that screens need no changes when the real SDK is released:

```ts
import { createGamiWallet } from '@gami/wallet-sdk';

const wallet = await createGamiWallet();
const stats  = await wallet.checkMyLevel(); // { level, totalXP, xpToNextLevel, … }
const unsub  = wallet.subscribeToLevelUps((user, newLevel, totalXP) => {});
```

### Chain writes (Outbox Envelope pattern)

Client code **never** mutates chain state synchronously. Every write intent returns a `ChainActionEnvelope` with status `queued`. An off-app supervisor (`gami-agent`) performs the real write and advances the envelope through `settling → settled`. XP displayed before settlement is optimistic; the edge/chain is always the source of truth.

---

## Linting & Formatting

```sh
# Type-aware lint (oxlint)
npm run lint

# CSS lint
npm run lint:css

# Format all files
npm run format

# Check formatting without writing
npm run format:check
```

---

## Deployment

### iOS & Android builds

Use [EAS Build](https://docs.expo.dev/build/introduction/) (Expo Application Services):

```sh
npx eas build --platform ios
npx eas build --platform android
```

### Supabase Edge Functions

Edge Functions live in `supabase/functions/`. Deploy with the Supabase CLI:

```sh
supabase functions deploy nova-chat
```

---

## Need help?

- 📚 [Expo Documentation](https://docs.expo.dev/)
- 📚 [Supabase Documentation](https://supabase.com/docs)
- 📚 [Privy Documentation](https://docs.privy.io/)
- 💬 [Expo Discord](https://chat.expo.dev/)
