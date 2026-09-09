import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function DocsPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="Documentation"
      description="Integrate XP, quests, and stablecoin-settled rewards with the Gami SDK, the MCP server, and the MCP client."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Quick start</h2>
        <ol className="list-decimal space-y-3 pl-5">
          <li>Obtain a partner key for the Gami MCP server.</li>
          <li>Connect your MCP client and call quest tools over Streamable HTTP.</li>
          <li>
            Emit verified actions. The rules engine decides what qualifies, computes the XP
            owed, and settles any funded reward on Base.
          </li>
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
            <span className="font-display font-bold text-white">XP</span> — a non-transferable
            progression record. It cannot be bought, sold, transferred or redeemed, and it
            carries no monetary value.
          </li>
          <li>
            <span className="font-display font-bold text-white">Onchain settlement</span> —
            Merkle-anchored proofs on Base for claims and leaderboards. Reward payouts settle in
            USDC or EURC, funded by the app operator.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Emitting an event</h2>
        <pre className="overflow-x-auto rounded border border-gami-purple/30 bg-black/60 p-4 font-mono text-xs leading-relaxed text-gray-300">
{`import { Gami } from '@gami/sdk';

const gami = new Gami({
  apiKey: process.env.GAMI_SECRET_KEY,
  chainId: 8453,               // Base
});

await gami.events.emit({
  userId: 'user_123',
  type: 'workout.completed',
  metadata: { minutes: 30 },
});

// Rewards, where an operator has funded them,
// settle in USDC or EURC on Base.`}
        </pre>
        <p className="text-sm leading-relaxed text-gray-500">
          Use a secret key server-side only. Base is chain ID 8453; it is the only network
          rewards settle on.
        </p>
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
          to="/waitlist"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Get SDK access
        </Link>
      </div>
    </SiteContentPage>
  );
}
