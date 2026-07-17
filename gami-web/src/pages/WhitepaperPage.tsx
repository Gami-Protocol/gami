export function WhitepaperPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold">Whitepaper</h1>
      <p className="mt-2 font-mono text-sm text-muted">Gami Protocol Tokenization Model — Smart Burn & Stable Spend Economy</p>

      <article className="prose prose-invert mt-12 max-w-none space-y-8 text-muted">
        <section>
          <h2 className="font-display text-2xl font-bold text-white">Executive Summary</h2>
          <p className="mt-4 leading-relaxed">
            Gami Protocol introduces an AI-powered token economy that combines sustainable tokenomics,
            real-world payments, and universal gamification. Rather than relying on speculative deflation,
            Gami permanently removes tokens from circulation through genuine protocol usage.
          </p>
          <p className="mt-4 leading-relaxed">
            The protocol separates governance, rewards, and payments into three complementary assets:
            $GAMI (governance & utility), Universal Points (non-transferable XP), and gUSD (stable spend balance).
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">Layer 1 — $GAMI</h2>
          <p className="mt-4">Governance voting, validator security, staking rewards, AI premium features,
            MCP licensing, enterprise integrations, protocol fees, treasury management, marketplace settlement.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">Layer 2 — Universal Points</h2>
          <p className="mt-4">Earned through shopping, gaming, fitness, referrals, quests, community participation,
            and AI challenges. Non-transferable. Unlock levels, badges, reputation, leaderboards, and premium experiences.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">Layer 3 — Stable Spending Balance</h2>
          <p className="mt-4">Gami Wallet provides stable spending via physical/virtual cards, Apple Pay, Google Pay,
            and online merchants. Assets auto-convert to stable balance before settlement.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">Smart Burn Engine</h2>
          <p className="mt-4">40% buy back and burn · 30% treasury · 20% staking rewards · 10% liquidity provisioning.
            Governance can adjust allocations over time within bounded ranges.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-white">AI-Powered Monetary Policy</h2>
          <p className="mt-4">AI agents continuously monitor treasury reserves, transaction volume, DAU, TVL, staking
            participation, market volatility, and partner budgets — dynamically adjusting burn percentage, reward
            emissions, cashback rates, and XP multipliers.</p>
        </section>

        <section className="border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-200">
            Disclaimer: This whitepaper is for informational purposes only and does not constitute an offer
            to sell or solicitation to buy securities. Consult qualified legal counsel before participating.
          </p>
        </section>
      </article>
    </div>
  );
}
