# Gami Agentic Quest — Web Interface

Production-grade Agentic Questing Chat Interface for the Gami Protocol AI Agent Layer.

## Stack

- Next.js 15 (App Router, React 19)
- Tailwind CSS v4
- shadcn/ui-style primitives
- Framer Motion
- Zustand + Zod

## Quick start

```bash
cd gami-agentic-web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3010](http://localhost:3010).

## API

`POST /api/chat/agentic-quest`

Headers:
- `Content-Type: application/json`
- `x-partner-key: dev-partner-key-gami-5144` (or your `GAMI_PARTNER_KEY`)

Body:
```json
{
  "sessionId": "sess_abc123",
  "latestUserMessage": "I want a fitness quest"
}
```

## Try these prompts

- `I want a fitness quest` — creates a new campaign (`CREATED`)
- `I finished my workout` — advances or completes the active quest
- `What quests do I have?` — conversational status (`NONE`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3010 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | TypeScript check |
