import allocation from '@/data/allocation.json';

export default function TokenomicsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold">Tokenomics</h1>
      <p className="mt-4 text-muted">
        Total supply: 1 billion $GAMI. Fixed supply with smart burn tied to protocol usage.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Allocation</h2>
        <div className="mt-6 space-y-3">
          {allocation.allocation.map((item) => (
            <div key={item.bucket} className="sticker-shadow border-2 border-white/10 bg-surface p-4">
              <div className="flex justify-between">
                <span className="font-display font-bold capitalize">{item.bucket.replace(/_/g, ' ')}</span>
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

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Smart Burn Engine</h2>
        <p className="mt-4 text-muted">Protocol revenue allocation (governance-adjustable within bounds):</p>
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
    </div>
  );
}
