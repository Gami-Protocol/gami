# Gami Agentic Quest — Web Interface

Production-grade Agentic Questing Chat Interface for the Gami Protocol AI Agent Layer.

Agentic tooling connects over **MCP** (Model Context Protocol): an MCP server exposes quest tools, and the chat UI uses an MCP client to call them.

## Stack

- Next.js 15 (App Router, React 19)
- Tailwind CSS v4
- shadcn/ui-style primitives
- Framer Motion
- Zustand + Zod
- MCP server (`mcp-handler` + `@modelcontextprotocol/sdk`)
- MCP client (`@modelcontextprotocol/sdk`)

## Quick start

```bash
cd gami-agentic-web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3010](http://localhost:3010).

## MCP server

Streamable HTTP endpoint: `POST|GET|DELETE /api/mcp`

Auth (either header):
- `x-partner-key: dev-partner-key-gami-5144`
- `Authorization: Bearer dev-partner-key-gami-5144`

Or set `GAMI_PARTNER_KEY` / `NEXT_PUBLIC_GAMI_PARTNER_KEY`.

### Tools

| Tool | Description |
|------|-------------|
| `agentic_quest_chat` | Natural-language quest orchestration |
| `create_quest` | Forge a campaign from an intent |
| `verify_quest_progress` | Advance or complete the active quest |
| `get_quest_status` | Read XP, level, and quest profiles |

### Connect an external MCP client

```json
{
  "gami-agentic-quest": {
    "url": "http://localhost:3010/api/mcp",
    "headers": {
      "x-partner-key": "dev-partner-key-gami-5144"
    }
  }
}
```

## MCP client

The chat UI uses `lib/mcp/client.ts` to call `agentic_quest_chat` over Streamable HTTP.

Example tool arguments:

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
