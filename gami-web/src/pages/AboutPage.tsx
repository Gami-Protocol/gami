import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function AboutPage() {
  return (
    <SiteContentPage
      eyebrow="Company"
      title="About Gami Protocol"
      description="Onchain loyalty infrastructure. One SDK turns user behaviour into XP, quests and stablecoin-settled rewards on Base."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">What we build</h2>
        <p className="leading-relaxed">
          Every app that wants a loyalty programme ends up building the same things: a way to
          verify that a user did something, a rule for what it is worth, a record of what they
          have earned, and a way to pay it out. Gami is that, once, as infrastructure.
        </p>
        <p className="leading-relaxed">
          Partners connect through one SDK or the MCP client and emit verified actions. Gami
          handles identity, eligibility, anti-abuse, the progression record, and settlement.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Two things, kept separate</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-display font-bold text-white">XP</span> — a non-transferable
            record of progression. It cannot be bought, sold, transferred or redeemed, it is not
            a financial instrument, and it carries no monetary value. Nothing multiplies it in
            exchange for holding or locking an asset.
          </li>
          <li>
            <span className="font-display font-bold text-white">Rewards</span> — funded by the
            app operator and settled in USDC or EURC on Base. A separate mechanism with a
            separate ledger.
          </li>
        </ul>
        <p className="leading-relaxed text-gray-500">
          Keeping these apart is deliberate. The moment progression has a price, it stops being
          progression.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Where it settles</h2>
        <p className="leading-relaxed">
          Base is the settlement network — chain ID 8453 — chosen because paymaster sponsorship
          makes small rewards viable and because USDC and EURC are already native there. Gami
          routes stablecoins that authorised third parties issue. It issues nothing and holds no
          client money. See{' '}
          <Link to="/settlement" className="text-gami-accent underline-offset-2 hover:underline">
            settlement
          </Link>{' '}
          and{' '}
          <Link to="/base" className="text-gami-accent underline-offset-2 hover:underline">
            why Base
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Get started</h2>
        <p className="leading-relaxed">
          Read the developer docs to see how an integration is shaped, or join the developer
          waitlist for early SDK access and a test environment. Common questions are answered on
          the{' '}
          <Link to="/#faq" className="text-gami-accent underline-offset-2 hover:underline">
            homepage FAQ
          </Link>
          .
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/waitlist"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Join the developer waitlist
        </Link>
        <Link
          to="/developers/docs"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Developer Docs
        </Link>
      </div>
    </SiteContentPage>
  );
}
