import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="text-center">
        <p className="font-mono text-sm tracking-widest text-secondary">THE ULTIMATE GAMIFIED WALLET</p>
        <h1 className="font-display mt-4 text-5xl font-bold md:text-7xl">
          Earn. Quest. Connect. <span className="text-primary">Reward.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Gami Protocol combines sustainable tokenomics, real-world payments, and universal gamification
          powered by AI. Every transaction strengthens the $GAMI ecosystem.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/sale"
            className="sticker-shadow bg-primary px-8 py-4 font-display font-bold uppercase tracking-wide"
          >
            Join the Sale
          </Link>
          <Link
            href="/wallet"
            className="border-2 border-white/20 px-8 py-4 font-display font-bold uppercase tracking-wide hover:border-primary"
          >
            Get the Wallet
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-6 md:grid-cols-3">
        {[
          { title: '$GAMI', sub: 'Governance, staking, protocol utility' },
          { title: 'Universal Points', sub: 'Non-transferable reputation & engagement' },
          { title: 'gUSD', sub: 'Stable spend balance for everyday payments' },
        ].map((item) => (
          <div key={item.title} className="sticker-shadow border-2 border-white/10 bg-surface p-6">
            <h3 className="font-display text-xl font-bold text-primary">{item.title}</h3>
            <p className="mt-2 text-muted">{item.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-24">
        <h2 className="font-display text-3xl font-bold">Protocol Flywheel</h2>
        <div className="mt-8 grid gap-4 font-mono text-sm md:grid-cols-2">
          {[
            'Businesses integrate the Gami SDK',
            'Users earn XP and rewards',
            'Users spend using the Gami Wallet',
            'Protocol revenue increases',
            'Treasury buys back $GAMI',
            'Tokens are permanently burned',
            'Scarcity increases → staking demand grows',
            'More businesses join the ecosystem',
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3 border border-white/10 p-4">
              <span className="text-primary">{String(i + 1).padStart(2, '0')}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 text-center">
        <p className="font-mono text-xs text-muted">PARTNERS</p>
        <div className="mt-4 flex justify-center gap-8 text-muted">
          <span>Privy</span>
          <span>Hermes AI</span>
          <span>Wispr</span>
          <span>Dodo Payments</span>
        </div>
      </section>
    </div>
  );
}
