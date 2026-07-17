'use client';

const NETWORKS = [
  { name: 'Ethereum', status: 'Supported' },
  { name: 'Base', status: 'Supported' },
  { name: 'Arbitrum', status: 'Supported' },
  { name: 'Polygon', status: 'Supported' },
  { name: 'Optimism', status: 'Supported' },
  { name: 'Solana', status: 'Supported' },
  { name: 'Bitcoin', status: 'Planned' },
  { name: 'Sui', status: 'Planned' },
  { name: 'Aptos', status: 'Planned' },
];

export function BlockchainSection() {
  return (
    <section id="blockchain" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Blockchain
        </p>
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
          Portable value across chains
        </h2>
        <p className="mt-4 text-zinc-400">
          Universal Points, XP, and $GAMI with L2 settlement and a stablecoin strategy built for
          enterprise-friendly USDC/USDT flows. Bridge capabilities roll out in phases — future
          networks are clearly labeled as planned.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Universal Points', 'Non-transferable XP that travels with identity across partners.'],
          ['$GAMI', 'Governance, staking, premium access, and reward alignment.'],
          ['Stable settlement', 'USDC/USDT support with wrapped assets and phased bridges.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-3xl border border-white/8 bg-card p-6">
            <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">{title}</h3>
            <p className="mt-3 text-sm text-zinc-400">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NETWORKS.map((network) => (
          <div
            key={network.name}
            className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/30 px-4 py-3"
          >
            <span className="text-sm">{network.name}</span>
            <span
              className={
                network.status === 'Supported'
                  ? 'text-xs text-emerald-300'
                  : 'text-xs text-zinc-500'
              }
            >
              {network.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
