import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import allocation from '@/data/allocation.json';

const UTILITIES = [
  ['XP Multiplier', 'Holding or staking $GAMI can boost XP earnings.'],
  ['Tier Access', 'Premium tiers and partner features can require $GAMI staking.'],
  [
    'Reward Pools',
    'Treasury and fee flows can fund user rewards, quests, and sponsored incentives.',
  ],
  [
    'Governance',
    'Holders can vote on protocol parameters, reward formulas, fee rates, and ecosystem programs.',
  ],
  [
    'Partner Access',
    'Partners can stake or subscribe for higher campaign limits, analytics, SDK access, and lower fees.',
  ],
] as const;

const ILLUSTRATIVE_ALLOCATION = [
  ['Community and reward pools', 50],
  ['Team and advisors', 20],
  ['Strategic partners and investors', 20],
  ['Treasury and reserves', 10],
] as const;

const TGE_CHECKLIST = [
  'MVP wallet live with XP, quests, and claims.',
  'SDK integrated with initial design partners.',
  'Token legal memo completed.',
  'Treasury contracts audited.',
  'Vesting contracts finalized.',
  'Market maker and liquidity plan agreed.',
  'Exchange/listing strategy prepared.',
  'Community campaign and airdrop system ready.',
  'Token risk disclosures complete.',
  'Governance roadmap published.',
] as const;

export function TokenomicsPage() {
  return (
    <>
    <div className="mx-auto max-w-4xl px-6 py-16">
      <GamiTokenLogo className="mb-4 h-14 w-14" />
      <h1 className="font-display text-4xl font-bold">Tokenomics</h1>
      <p className="mt-4 text-muted">
        Total supply: 1 billion $GAMI. Fixed supply with smart burn tied to protocol usage.
      </p>

      <section className="mt-12 border-2 border-white/10 bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Token purpose</p>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          $GAMI is the utility and governance token for the Gami Protocol economy. It supports
          staking tiers, XP multipliers, premium partner access, governance, reward pool funding,
          treasury coordination, and ecosystem incentives.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {UTILITIES.map(([title, detail], index) => (
            <article key={title} className="border border-white/10 p-4">
              <p className="font-mono text-xs text-primary">0{index + 1}</p>
              <h2 className="mt-2 font-display text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm text-muted">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Current protocol allocation</h2>
        <p className="mt-3 text-sm text-muted">
          This is the current published 1 billion token model used by the protocol contracts and
          sale configuration.
        </p>
        <div className="mt-6 space-y-3">
          {allocation.allocation.map((item) => (
            <div
              key={item.bucket}
              className="sticker-shadow border-2 border-white/10 bg-surface p-4"
            >
              <div className="flex justify-between">
                <span className="font-display font-bold capitalize">
                  {item.bucket.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-primary">{item.percent}%</span>
              </div>
              <p className="mt-1 font-mono text-sm text-muted">
                {Number(item.tokens).toLocaleString()} GAMI · {item.vesting}
              </p>
              <div className="mt-2 h-2 bg-white/10">
                <div className="h-full bg-primary" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 border-2 border-primary/50 bg-primary/5 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Illustrative allocation proposal
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">Simplified ecosystem model</h2>
        <p className="mt-3 text-sm text-muted">
          This proposal is separate from the current protocol allocation above. Final allocation
          requires legal, treasury, and governance review.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ILLUSTRATIVE_ALLOCATION.map(([label, percent]) => (
            <div key={label} className="border border-white/10 bg-surface p-4">
              <div className="flex justify-between gap-3">
                <span className="font-display font-bold">{label}</span>
                <span className="font-mono text-primary">{percent}%</span>
              </div>
              <div className="mt-3 h-2 bg-white/10">
                <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Smart Burn Engine</h2>
        <p className="mt-4 text-muted">
          Protocol revenue allocation (governance-adjustable within bounds):
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Object.entries(allocation.feeRouting).map(([key, pct]) => (
            <div key={key} className="border border-white/10 p-4 text-center">
              <p className="font-mono text-2xl font-bold text-primary">{pct}%</p>
              <p className="mt-1 text-sm capitalize text-muted">{key}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Sale Phases</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-muted">
                <th className="p-3">Phase</th>
                <th className="p-3">Price</th>
                <th className="p-3">Hard Cap</th>
                <th className="p-3">Per Wallet</th>
              </tr>
            </thead>
            <tbody>
              {allocation.salePhases.map((phase) => (
                <tr key={phase.id} className="border-b border-white/5">
                  <td className="p-3 capitalize">{phase.id}</td>
                  <td className="p-3">${phase.priceUsd}</td>
                  <td className="p-3">${phase.hardCapUsd.toLocaleString()}</td>
                  <td className="p-3">${phase.perWalletCapUsd.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">TGE readiness checklist</h2>
        <p className="mt-3 text-muted">
          Token launch follows product, legal, treasury, liquidity, and governance readiness.
        </p>
        <ol className="mt-6 grid gap-3 md:grid-cols-2">
          {TGE_CHECKLIST.map((item, index) => (
            <li key={item} className="flex gap-3 border border-white/10 p-4 text-sm text-muted">
              <span className="font-mono text-primary">{String(index + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="border-2 border-white/10 bg-surface p-6">
          <h2 className="font-display text-2xl font-bold">Launch strategy</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Do not lead with speculative token claims. Lead with protocol utility, partner adoption,
            SDK usage, points activity, wallet engagement, and transparent reward flows. Token
            launch should amplify a working ecosystem, not substitute for one.
          </p>
        </article>
        <article className="border-2 border-white/10 bg-surface p-6">
          <h2 className="font-display text-2xl font-bold">Airdrop strategy</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Airdrops should reward useful actions: early wallet signup, XP earned, quest completion,
            partner integrations, developer contributions, community ambassador work, staking
            participation, and verified referrals.
          </p>
        </article>
      </section>

      <section className="mt-12 border-2 border-white/10 p-6">
        <h2 className="font-display text-2xl font-bold">Risk controls</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Geofencing where required, claim caps, sybil checks, lockups, vesting, treasury controls,
          anti-bot scoring, and legal review for cash-equivalent rewards.
        </p>
      </section>
    </div>
    <GamiFooter variant="ico" />
    </>
  );
}
