import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';
import { StateBadge } from '@/components/gami/StateBadge';

const REASONS = [
  {
    title: 'Micro-rewards are economically viable',
    body: 'Paymaster sponsorship lets an operator cover gas, so a sub-cent reward can actually be delivered. On most networks the fee costs more than the reward is worth, which makes loyalty economics impossible.',
  },
  {
    title: 'MiCA-authorised stablecoins are already native',
    body: 'USDC and EURC are issued natively on Base by an authorised issuer. Gami routes them rather than issuing anything, so settlement rests on someone else’s licence — deliberately.',
  },
  {
    title: 'Onboarding without a seed phrase',
    body: 'Privy and passkeys create a smart wallet from an email address or a fingerprint. No extension to install, nothing to write down, no recovery phrase to lose.',
  },
  {
    title: 'Distribution through Base App',
    body: 'Apps surfaced in Base App reach users who already hold a wallet, which removes the step where most loyalty funnels lose people.',
  },
];

const NETWORKS = [
  {
    name: 'Base',
    state: 'shipped' as const,
    detail: 'Settlement network. Chain ID 8453. All reward settlement happens here.',
  },
  {
    name: 'Polygon',
    state: 'shipped' as const,
    detail: 'Read-only. Balances and activity can be read. Nothing settles here.',
  },
  {
    name: 'Arbitrum',
    state: 'shipped' as const,
    detail: 'Read-only. Balances and activity can be read. Nothing settles here.',
  },
  {
    name: 'Solana',
    state: 'roadmap' as const,
    detail: 'Not available. No read support, no settlement, no bridge.',
  },
  {
    name: 'Bridging',
    state: 'roadmap' as const,
    detail: 'Not available. There is no Gami bridge in production.',
  },
  {
    name: 'Gami Chain',
    state: 'roadmap' as const,
    detail:
      'A sovereign Cosmos SDK Layer 1 with its own validator set and independent consensus, secured by no other chain. Not available.',
  },
];

export function BasePage() {
  return (
    <SiteContentPage
      eyebrow="Network"
      title="Why Base"
      description="Base is the settlement network. Chain ID 8453."
    >
      <section className="space-y-6">
        {REASONS.map((r) => (
          <div key={r.title} className="border-2 border-white/10 bg-black/40 p-6 neo-border">
            <h2 className="mb-3 font-display text-xl font-bold uppercase text-white">{r.title}</h2>
            <p className="leading-relaxed">{r.body}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">What runs where</h2>
        <ul className="divide-y divide-white/5 border-y border-white/10">
          {NETWORKS.map((net) => (
            <li key={net.name} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-lg font-bold text-white">{net.name}</span>
                <StateBadge state={net.state} />
              </div>
              <p className="text-sm leading-relaxed text-gray-400">{net.detail}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-gray-500">
          Anything marked roadmap is not available today, may change, and may not ship. Nothing
          on this page is a commitment to a timeline.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/settlement"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          How settlement works
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
