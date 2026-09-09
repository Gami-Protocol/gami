import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';
import { StateBadge } from '@/components/gami/StateBadge';

const PHASES = [
  {
    phase: 'Phase 1',
    when: 'Today',
    state: 'shipped' as const,
    title: 'Route existing stablecoins',
    points: [
      'Rewards settle in USDC and EURC on Base — stablecoins issued by authorised third parties, already native to the network.',
      'GUSD, GEURO and GGBP are display denominations. They are labels for showing a balance in a familiar currency. They are not assets and nothing is issued to back them.',
      'Fiat on- and off-ramps run through licensed partners. Gami is not in the flow of funds.',
      'Gami holds no client money and issues nothing.',
    ],
  },
  {
    phase: 'Phase 2',
    when: '2027, subject to volume and a partner',
    state: 'dependent' as const,
    title: 'White-label issuance under a partner licence',
    points: [
      'Issuance would sit under an authorised issuer’s licence, not Gami’s.',
      'Depends on a signed partner, on settlement volume justifying it, and on that partner’s regulatory permissions.',
      'None of this is contracted. It is a direction, not a commitment.',
    ],
  },
  {
    phase: 'Phase 3',
    when: '2028 at the earliest, only on evidence',
    state: 'dependent' as const,
    title: 'Own issuance under authorisation',
    points: [
      'Would require Gami to hold its own authorisation under the UK regime and MiCA.',
      'A fiat-referenced token is e-money. Under MiCA it may be issued only by a credit institution or an authorised electronic money institution. In the UK, issuance becomes a regulated activity from 25 October 2027.',
      'Gami holds no such authorisation and has not applied for one.',
    ],
  },
];

export function SettlementPage() {
  return (
    <SiteContentPage
      eyebrow="Settlement"
      title="We route. We do not issue."
      description="How rewards actually get paid, what depends on what, and what Gami is not."
    >
      <section className="space-y-4 border-2 border-white/10 bg-black/40 p-6 neo-border">
        <h2 className="font-display text-xl font-bold uppercase text-white">In one line</h2>
        <p className="leading-relaxed">
          Gami moves stablecoins that other, authorised institutions issue. It does not issue a
          stablecoin, does not hold client money, and is not a payment institution or an
          electronic money institution.
        </p>
      </section>

      {PHASES.map((p) => (
        <section key={p.phase} className="space-y-4 border-l-2 border-white/10 pl-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-gami-accent">
              {p.phase}
            </span>
            <StateBadge state={p.state} />
            <span className="font-mono text-xs text-gray-500">{p.when}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">{p.title}</h2>
          <ul className="space-y-3">
            {p.points.map((point) => (
              <li key={point} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-4 border-2 border-amber-400/30 bg-amber-400/5 p-6 neo-border">
        <h2 className="font-display text-xl font-bold uppercase text-amber-200">
          What this page is not
        </h2>
        <p className="leading-relaxed">
          Phases 2 and 3 describe dependencies, not a product roadmap with dates. Each depends
          on authorisation Gami does not hold and on partners not yet contracted. Neither may
          happen. Nothing here is an offer, a solicitation, or financial advice.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/base"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Why Base
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
