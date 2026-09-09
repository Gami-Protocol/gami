import { Link } from 'react-router-dom';

import { DiscoveryFaq } from '@/components/gami/DiscoveryFaq';
import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiLogo } from '@/components/gami/GamiLogo';
import { QuestNotification } from '@/components/gami/QuestNotification';

/** The four stages a user action passes through. */
const PIPELINE = [
  {
    step: 'Event',
    detail:
      'Your app emits a verified action through the Gami SDK or the MCP client — a quest step, a purchase, a referral, a workout.',
  },
  {
    step: 'Decide',
    detail:
      'Protocol rules determine whether the action qualifies: eligibility, rate limits, anti-abuse checks.',
  },
  {
    step: 'Compute',
    detail:
      'The XP or reward owed is calculated from the rule you configured. XP is written to the user’s progression record.',
  },
  {
    step: 'Settle',
    detail:
      'Where an operator has funded a reward, payout settles in USDC or EURC on Base, sponsored so the user never holds gas.',
  },
];

const WHY_BASE = [
  {
    title: 'Micro-rewards actually work',
    body: 'Paymaster sponsorship makes a sub-cent reward economically viable. On most networks the fee exceeds the reward.',
  },
  {
    title: 'Regulated stablecoins, already native',
    body: 'USDC and EURC are issued natively on Base under MiCA authorisation. We route them; we do not issue anything.',
  },
  {
    title: 'Onboarding without a seed phrase',
    body: 'Privy and passkeys create a smart wallet from an email or a fingerprint. No extension, nothing to write down.',
  },
  {
    title: 'Distribution through Base App',
    body: 'Apps built on Base reach an audience already holding a wallet, which removes the hardest step in the funnel.',
  },
];

/** Shipped vs roadmap must read differently at a glance. */
const NETWORKS = [
  { name: 'Base', note: 'Settlement network · chain ID 8453', state: 'shipped' as const },
  { name: 'Polygon', note: 'Read-only', state: 'shipped' as const },
  { name: 'Arbitrum', note: 'Read-only', state: 'shipped' as const },
  { name: 'Solana', note: 'Not available', state: 'roadmap' as const },
  { name: 'Gami Chain', note: 'Sovereign Cosmos SDK Layer 1 · not available', state: 'roadmap' as const },
];

function StateBadge({ state }: { state: 'shipped' | 'roadmap' }) {
  return state === 'shipped' ? (
    <span className="inline-flex items-center gap-1.5 border-2 border-green-400 bg-green-400/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Shipped
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 border-2 border-dashed border-gray-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500">
      Roadmap
    </span>
  );
}

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pb-20 pt-32">
        <div className="absolute left-[-5rem] top-1/4 h-96 w-96 animate-pulse bg-gami-purple opacity-20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-[-5rem] h-96 w-96 animate-pulse bg-gami-accent opacity-20 blur-[120px]" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-block border border-gami-purple bg-gami-purple/20 px-3 py-1 font-mono text-xs tracking-tighter text-gami-accent">
              BUILT ON BASE // CHAIN ID 8453
            </div>
            <h1 className="mb-8 font-display text-6xl font-bold leading-none md:text-8xl">
              LOYALTY THAT <span className="text-gami-purple">SETTLES</span> ONCHAIN.
            </h1>
            <p className="mb-10 max-w-xl text-xl font-light leading-relaxed text-gray-400">
              One SDK turns user behaviour into XP, quests and stablecoin-settled rewards —
              Base-native, gasless, no seed phrase.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link
                to="/developers/docs"
                className="gami-gradient neo-border px-8 py-4 font-display text-lg font-bold uppercase tracking-wider shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                Read the docs
              </Link>
              <Link
                to="/waitlist"
                className="border-2 border-white px-8 py-4 font-display text-lg font-bold uppercase tracking-wider transition-all hover:bg-white hover:text-black"
              >
                Join the developer waitlist
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="token-3d relative flex h-64 w-64 items-center justify-center md:h-96 md:w-96">
              <div className="absolute inset-8 rounded-full bg-[#702FE5]/30 blur-3xl" />
              <GamiLogo className="relative z-10 h-56 w-56 drop-shadow-[0_0_40px_rgba(112,47,229,0.55)] md:h-80 md:w-80" />
              <div className="absolute -right-10 -top-10 h-20 w-20 animate-spin-slow border-2 border-gami-accent/30" />
              <div className="absolute bottom-20 -left-20 h-12 w-12 bg-gami-accent/40 blur-xl" />
              <div className="neo-border absolute left-0 top-0 animate-bounce bg-black/80 px-4 py-2 font-mono text-sm text-gami-accent">
                +500 XP
              </div>
              <div
                className="neo-border absolute bottom-10 right-0 animate-bounce bg-black/80 px-4 py-2 font-mono text-sm text-green-400"
                style={{ animationDelay: '1s' }}
              >
                QUEST COMPLETE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden border-y-4 border-black bg-black/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gami-accent">
              How it works
            </p>
            <h2 className="mb-4 font-display text-5xl font-bold uppercase italic">
              Event → Decide → Compute → Settle
            </h2>
            <p className="max-w-2xl text-lg text-gray-400">
              You write the rule. The protocol handles identity, verification and payout.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((stage, index) => (
              <div
                key={stage.step}
                className="bg-gami-bg p-8 neo-border shadow-brutal transition-all hover:shadow-brutal-purple"
              >
                <div className="gami-gradient neo-border mb-6 flex h-10 w-10 items-center justify-center font-display font-bold">
                  {index + 1}
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold uppercase">{stage.step}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{stage.detail}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-3xl border-l-2 border-gami-purple pl-4 text-sm leading-relaxed text-gray-500">
            XP is a non-transferable record of progression. It cannot be bought, sold,
            transferred or redeemed, and it carries no monetary value. Rewards are a separate
            thing entirely: they are funded by the app operator and settle in stablecoins.
          </p>
        </div>
      </section>

      {/* Why Base */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gami-accent">
          Why Base
        </p>
        <h2 className="mb-4 font-display text-5xl font-bold uppercase italic">
          The settlement home
        </h2>
        <p className="mb-12 max-w-2xl text-lg text-gray-400">
          Loyalty economics only work if a small reward costs almost nothing to deliver.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {WHY_BASE.map((item) => (
            <div key={item.title} className="border-2 border-white/10 bg-black/40 p-8 neo-border">
              <h3 className="mb-3 font-display text-xl font-bold uppercase">{item.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-2 border-white/10 bg-black/40 p-8 neo-border">
          <h3 className="mb-6 font-display text-xl font-bold uppercase">Network support</h3>
          <ul className="space-y-4">
            {NETWORKS.map((net) => (
              <li
                key={net.name}
                className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-display text-lg font-bold text-white">{net.name}</span>
                  <span className="ml-3 font-mono text-xs text-gray-500">{net.note}</span>
                </div>
                <StateBadge state={net.state} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Settlement layer */}
      <section className="border-y-4 border-black bg-black/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gami-accent">
            Settlement layer
          </p>
          <h2 className="mb-6 font-display text-5xl font-bold uppercase italic">
            We route. We do not issue.
          </h2>
          <p className="mb-6 max-w-3xl text-lg leading-relaxed text-gray-400">
            Rewards settle in USDC and EURC on Base — stablecoins issued by authorised third
            parties. GUSD, GEURO and GGBP are display denominations: labels for showing a
            balance in a familiar currency. They are not assets, and Gami issues nothing.
          </p>
          <p className="mb-10 max-w-3xl leading-relaxed text-gray-500">
            Gami holds no client money. Fiat on- and off-ramps run through licensed partners.
            Anything beyond this depends on authorisation Gami does not hold today.
          </p>
          <Link
            to="/settlement"
            className="inline-block border-2 border-white px-8 py-4 font-display text-sm font-bold uppercase tracking-wider transition-all hover:bg-white hover:text-black"
          >
            How settlement works →
          </Link>
        </div>
      </section>

      {/* For developers */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gami-accent">
              For developers
            </p>
            <h2 className="mb-6 font-display text-5xl font-bold uppercase italic leading-tight">
              One integration, not a rewards backend
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-gray-400">
              Connect once through the Gami SDK or the MCP client and server. Emit verified
              actions; get identity, quest logic, anti-abuse and settlement without building
              or operating any of it.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/developers/docs"
                className="gami-gradient neo-border px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider"
              >
                Documentation
              </Link>
              <Link
                to="/developers/mcp-server"
                className="border-2 border-white px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black"
              >
                MCP server
              </Link>
            </div>
          </div>

          <div className="neo-border bg-black p-8 shadow-brutal-purple">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="font-mono text-xs text-gami-accent">quickstart.ts</span>
            </div>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-gray-300">
{`import { Gami } from '@gami/sdk';

const gami = new Gami({ apiKey: process.env.GAMI_KEY });

// Report something the user did.
await gami.events.emit({
  userId: 'user_123',
  type: 'workout.completed',
  metadata: { minutes: 30 },
});

// Gami decides, computes XP, and settles
// any funded reward on Base.`}
            </pre>
          </div>
        </div>
      </section>

      <DiscoveryFaq />

      {/* Waitlist */}
      <section className="relative overflow-hidden bg-gami-purple py-32">
        <div className="absolute right-0 top-0 p-20 opacity-10">
          <svg viewBox="0 0 100 100" className="h-96 w-96 fill-white">
            <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-8 font-display text-5xl font-bold uppercase italic leading-none text-black md:text-7xl">
            Build on Gami
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-black/80">
            Early access to the SDK, a test environment on Base, and support from the
            engineers building the protocol.
          </p>

          <Link
            to="/waitlist"
            className="neo-border inline-block bg-black px-10 py-4 font-display text-lg font-bold uppercase text-white shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Join the developer waitlist
          </Link>

          <p className="mx-auto mt-8 max-w-xl font-mono text-[11px] uppercase leading-relaxed text-black/60">
            A product waitlist for developers. Not an offer, not a sale, and no entitlement
            of any kind.
          </p>
        </div>
      </section>

      <GamiFooter />
      <QuestNotification />
    </>
  );
}
