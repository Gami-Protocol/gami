'use client';

const UTILITIES = [
  'Governance',
  'Staking',
  'Premium',
  'Rewards',
  'Treasury',
  'Marketplace',
  'XP Multipliers',
];

const ALLOCATION = [
  { label: 'Community', pct: 40 },
  { label: 'Public Sale', pct: 18 },
  { label: 'Ecosystem', pct: 15 },
  { label: 'Team', pct: 12 },
  { label: 'Investors', pct: 10 },
  { label: 'Liquidity', pct: 5 },
];

export function TokenSection() {
  return (
    <section id="token" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
            Token
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
            $GAMI
          </h2>
          <p className="mt-3 max-w-xl text-zinc-400">
            Utility across governance, staking, premium features, rewards, treasury, and marketplace
            incentives. Allocation below is <span className="text-white">proposed</span> and subject
            to governance approval.
          </p>
        </div>
        <p className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
          Proposed · not final
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {UTILITIES.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="rounded-3xl border border-white/8 bg-card p-6">
        <div className="space-y-4">
          {ALLOCATION.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>{row.label}</span>
                <span className="text-zinc-400">{row.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          No TGE countdown is shown until a public launch date is officially announced.
        </p>
      </div>
    </section>
  );
}
