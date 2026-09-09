import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';
import { StateBadge } from '@/components/gami/StateBadge';

const CAN_DO = [
  'Read protocol state: XP balances, quest progress, badge history, reward eligibility.',
  'Explain why a quest did or did not complete, citing the rule that decided it.',
  'Simulate an outcome — "if this user finishes this quest, what would they earn?" — without writing anything.',
  'Answer questions about the docs, the MCP tool set, and how an integration should be shaped.',
];

const CANNOT_DO = [
  'Move funds, sign transactions, or approve spending.',
  'Grant, adjust, or revoke XP, badges, or rewards.',
  'Change quest rules, eligibility, or protocol configuration.',
  'Act on a schedule, or take any action without a person asking for it in the moment.',
];

export function AgentsPage() {
  return (
    <SiteContentPage
      eyebrow="Product"
      title="NOVA"
      description="A read-and-simulate assistant over protocol state. It answers questions and models outcomes. It does not act."
    >
      <section className="space-y-4 border-2 border-white/10 bg-black/40 p-6 neo-border">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold uppercase text-white">Read and simulate</h2>
          <StateBadge state="shipped" />
        </div>
        <ul className="space-y-3">
          {CAN_DO.map((item) => (
            <li key={item} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 border-2 border-amber-400/30 bg-amber-400/5 p-6 neo-border">
        <h2 className="font-display text-xl font-bold uppercase text-amber-200">
          What NOVA cannot do
        </h2>
        <p className="leading-relaxed">
          This is a boundary in the architecture, not a setting. NOVA is given read access and
          a simulator. It holds no keys and has no write path to the protocol.
        </p>
        <ul className="space-y-3">
          {CANNOT_DO.map((item) => (
            <li key={item} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">How it fits</h2>
        <p className="leading-relaxed">
          Partners emit verified actions through the MCP client. The rules engine — not NOVA —
          decides what qualifies and computes what is owed. NOVA sits alongside that as a way
          to inspect and explain it: useful when you are integrating, debugging a quest, or
          answering a user asking why they did not get something.
        </p>
        <p className="leading-relaxed text-gray-500">
          Anything that changes state goes through the same authenticated API a developer
          would call, with a person or a server key behind it.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/developers/mcp-server"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          MCP server
        </Link>
        <Link
          to="/developers/docs"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Documentation
        </Link>
      </div>
    </SiteContentPage>
  );
}
