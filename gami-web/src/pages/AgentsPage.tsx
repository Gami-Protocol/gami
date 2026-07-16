import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function AgentsPage() {
  return (
    <SiteContentPage
      eyebrow="Product"
      title="AI Agents"
      description="Gami AI agents orchestrate quests, reward multipliers, and monetary policy so partners ship engagement without custom reward logic."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">What agents do</h2>
        <ul className="space-y-3">
          <li>Verify quest completions and partner events in real time.</li>
          <li>Tune XP multipliers, cashback rates, and burn parameters from live protocol signals.</li>
          <li>Power conversational quest flows inside the Gami Wallet experience.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">How it fits</h2>
        <p className="leading-relaxed">
          Partners emit actions through the SDK. Agents score and route those events through the rewards
          engine, then proofs anchor on Base for claimable, tamper-resistant settlement.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/wallet"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Launch App
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
