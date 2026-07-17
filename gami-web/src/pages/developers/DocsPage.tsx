import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function DocsPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="Documentation"
      description="Integrate Gami rewards, quests, and settlement into your product with the MCP server, MCP client, and event bus."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Quick start</h2>
        <ol className="list-decimal space-y-3 pl-5">
          <li>Obtain a partner key for the Gami MCP server.</li>
          <li>Connect your MCP client and call quest tools over Streamable HTTP.</li>
          <li>Let AI agents score quests and settle proofs on Base L2.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Core concepts</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-display font-bold text-white">Universal Identity</span> — one Gami handle and
            XP profile across partner apps.
          </li>
          <li>
            <span className="font-display font-bold text-white">MCP Server &amp; Client</span> — partners connect
            agentic tooling to emit quests, purchases, workouts, and referrals without custom infra.
          </li>
          <li>
            <span className="font-display font-bold text-white">On-Chain Settlement</span> — Merkle-anchored
            proofs on Base for claims and leaderboards.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/developers/mcp-client"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          MCP Client
        </Link>
        <Link
          to="/developers/mcp-server"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          MCP Server
        </Link>
        <Link
          to="/whitepaper"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Whitepaper
        </Link>
      </div>
    </SiteContentPage>
  );
}
