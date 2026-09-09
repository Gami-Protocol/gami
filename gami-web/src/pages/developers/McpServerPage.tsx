import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';
import { StateBadge } from '@/components/gami/StateBadge';

/** Mirrors the tools registered in gami-agentic-web/lib/mcp/register-tools.ts. */
const TOOLS = [
  {
    name: 'agentic_quest_chat',
    summary:
      'Send a natural-language message to the agent layer. Creates quests, verifies progress, and returns a conversational reply with quest state.',
  },
  {
    name: 'create_quest',
    summary:
      'Create a quest campaign from a short intent description — fitness, shopping, learning, and so on.',
  },
  {
    name: 'verify_quest_progress',
    summary: 'Verify completion of the active quest and advance or settle the XP it awards.',
  },
  {
    name: 'get_quest_status',
    summary: 'Return the session’s current XP, level, and active quest profiles.',
  },
];

export function McpServerPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="MCP Server"
      description="Connect an MCP client to the Gami quest server over Streamable HTTP."
    >
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-white">Tools</h2>
          <StateBadge state="shipped" />
        </div>
        <p className="leading-relaxed">
          Four tools are registered today. This list mirrors the server; if a tool is not here,
          it is not exposed.
        </p>
        <ul className="space-y-4">
          {TOOLS.map((tool) => (
            <li key={tool.name} className="border-2 border-white/10 bg-black/40 p-4 neo-border">
              <p className="font-mono text-sm font-bold text-gami-accent">{tool.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{tool.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Endpoint</h2>
        <p className="rounded border border-gami-purple/30 bg-gami-purple/10 p-4 font-mono text-xs text-gami-accent">
          Streamable HTTP · /api/mcp · x-partner-key or Authorization: Bearer
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Credential types</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-display font-bold text-white">Publishable</span> — browser MCP
            clients and public tool calls.
          </li>
          <li>
            <span className="font-display font-bold text-white">Secret</span> — server-side MCP
            agents, event verification, and settlement webhooks. Never ship this to a browser.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-white">Partner keys</h2>
          <StateBadge state="roadmap" />
        </div>
        <p className="leading-relaxed">
          Self-serve key provisioning is not open yet. Join the developer waitlist or email the
          team to be notified when credentials are available.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/waitlist"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Join the developer waitlist
        </Link>
        <a
          href="mailto:admin@gamiprotocol.io?subject=Gami%20MCP%20Server%20Access"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Contact Partners
        </a>
      </div>
    </SiteContentPage>
  );
}
