# GAMI Wallet

> **The wallet that levels you up.**

GAMI Wallet is a gamified crypto wallet for iOS and Android. It turns everyday on-chain actions into a progression game: earn XP, level up, unlock badges, and collect rewards — all from a single app powered by embedded wallets and an AI companion called **NOVA**.

---

## Features

- **XP & Levelling** — Every action (daily login, quest completion, referrals, on-chain interactions) earns XP. A quadratic curve drives level-ups and unlocks an in-app $GAMI balance.
- **Quests** — Complete curated on-chain and off-chain missions. NOVA personalises quests to your interests. Completions are submitted through the `gami-agent` supervisor and settled on-chain asynchronously.
- **Badges** — 24 soulbound badges (Starter → Gami God) that unlock at XP milestones.
- **$GAMI Balance** — A native token balance derived from lifetime XP and spend, shown on the home dashboard.
- **Send / Receive / Scan** — Transfer $GAMI to any address, generate a receive QR code, and scan QR codes with the device camera.
- **NOVA AI Companion** — A mood-aware mascot (shy / chill / hype) that adapts to your vibe and surfaces personalised quest picks.
- **Embedded Wallet Auth** — Powered by [Privy](https://privy.io) — passkeys, social login, and Apple Sign-In with no seed-phrase friction.
- **Dark ARCADE Aesthetic** — Full-dark UI with a magenta/purple/cyan/green neon palette.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React Native](https://reactnative.dev) + [Expo](https://expo.dev) (~54) |
| Language | TypeScript |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based) |
| Styling | [NativeWind](https://www.nativewind.dev) / Tailwind CSS via [Uniwind](https://github.com/unibeautify/nativewind) |
| Components | [HeroUI Native](https://heroui.net) |
| State | [Zustand](https://zustand-demo.pmnd.rs) |
| Auth & Wallets | [Privy Expo SDK](https://docs.privy.io/guide/expo) |
| Backend | [Supabase](https://supabase.com) |
| Blockchain | [Viem](https://viem.sh) |
| Analytics | [PostHog](https://posthog.com) |

---

## Project Structure

```
app/
  index.tsx           # Splash / routing entry
  (onboarding)/       # Sign-up flow: welcome → handle → interests → wallet → face-id → quests
  (app)/              # Authenticated screens: home, quests, badges, profile, send, receive, scan, nova, settings
components/
  gami/               # Design-system primitives (GCard, GScreen, GButton, GMono, NovaMascot, …)
lib/
  gami-sdk.ts         # Local wallet SDK — XP/levelling logic, quest envelope queue
  config.ts           # Earn rules, quests, badges, interest tags, avatar palette
  store.ts            # Zustand onboarding + profile store
  auth.ts             # Auth helpers (Privy + local fallback)
  supabase.ts         # Supabase client + profile sync
assets/               # App icon, splash, images
supabase/             # Database migrations & edge functions
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18 (use [nvm](https://github.com/nvm-sh/nvm) recommended)
- npm ≥ 10
- [Expo Go](https://expo.dev/go) on your iOS or Android device, **or** an iOS Simulator / Android Emulator

### Install

```sh
git clone https://github.com/Gami-Protocol/gami.git
cd gami
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
EXPO_PUBLIC_PRIVY_CLIENT_ID=<your-privy-client-id>
```

The app works without these variables in demo mode (local-only session, no cloud sync).

### Run

```sh
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` to open the iOS Simulator or Android Emulator.

---

## Development

### Linting & Formatting

```sh
npm run lint          # oxlint (type-aware)
npm run lint:css      # CSS-in-JS class lint
npm run format        # oxfmt auto-format
npm run format:check  # oxfmt check (CI)
```

### Native Builds

```sh
npm run ios       # expo run:ios
npm run android   # expo run:android
```

---

## Architecture Notes

- **Onboarding flow** is gate-kept by a persisted Zustand store (`useOnboardingStore`). The splash screen routes to `/(onboarding)/welcome` or `/(app)/home` based on the `onboarded` flag and an active Privy/Supabase session.
- **Quest completions** use an optimistic outbox pattern. The client immediately applies XP locally and emits a `ChainActionEnvelope` (queued → settling → settled) via the `gami-agent` supervisor rather than mutating chain state synchronously.
- **$GAMI balance** is derived from `totalXP * 0.002 - spentGami`, ensuring it always reflects lifetime activity.
- **Theming** is hard-coded to `dark` (`Uniwind.setTheme('dark')`) — GAMI Wallet is intentionally dark-only.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Run `npm run lint` and `npm run format:check` before opening a PR.
3. Keep PRs focused — one feature or fix per PR.

---

## License

See [LICENSE](./LICENSE) for details.
