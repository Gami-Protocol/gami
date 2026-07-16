import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function AboutPage() {
  return (
    <SiteContentPage
      eyebrow="Company"
      title="About Gami Protocol"
      description="Gami is the modular on-chain engine for the internet's rewards layer — universal XP, quests, and settlement for apps, games, and communities."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">What we build</h2>
        <p className="leading-relaxed">
          Partners plug into a shared identity, event bus, and AI orchestration layer instead of rebuilding
          loyalty infrastructure from scratch. Verified actions settle on Base L2 for near-zero fees and
          auditable claims.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Three-layer stack</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-display font-bold text-white">$GAMI</span> — governance, staking, protocol
            fees, and treasury coordination.
          </li>
          <li>
            <span className="font-display font-bold text-white">Universal Points</span> — non-transferable XP
            earned across quests, shopping, fitness, and referrals.
          </li>
          <li>
            <span className="font-display font-bold text-white">Stable Spend</span> — auto-converted balance for
            real-world payments via Gami Wallet.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/tokenomics"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Tokenomics
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
