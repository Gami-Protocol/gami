import { Link } from 'react-router-dom';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiLogo } from '@/components/gami/GamiLogo';
import { QuestNotification } from '@/components/gami/QuestNotification';


const ECOSYSTEM_CARDS = [
  {
    title: 'GAMI APP',
    description: 'Universal dashboard to track XP, quests, and rewards across every connected platform.',
    icon: 'grid',
    cta: 'Launch App',
    ctaStyle: 'outline' as const,
    href: '/wallet',
  },
  {
    title: 'AI AGENT PLATFORM',
    description: 'Autonomous engagement agents that dynamically generate quests and optimize reward systems in real-time.',
    icon: 'bolt',
    cta: 'Open Agent Platform',
    ctaStyle: 'primary' as const,
    href: '/wallet',
    featured: true,
  },
  {
    title: 'GAMI WALLET',
    description: 'Gamified crypto wallet that tracks rewards, XP progression, and on-chain identity.',
    icon: 'wallet',
    cta: null,
    href: '/wallet',
  },
  {
    title: 'DEV DASHBOARD',
    description: 'Add quests and leaderboards to any app in minutes with the Gami SDK.',
    icon: 'code',
    cta: 'Documentation',
    ctaStyle: 'muted' as const,
    href: '/whitepaper',
    code: true,
  },
  {
    title: '$GAMI TOKEN',
    description: 'Powering the universal rewards economy. Stake to multiply XP and govern the protocol.',
    icon: 'token',
    cta: 'View Launch',
    ctaStyle: 'purple' as const,
    href: '/waitlist',
  },
  {
    title: 'BROWSER EXT.',
    description: 'Earn rewards while you browse. Gami Extension detects partner sites and logs interactions.',
    icon: 'ext',
    cta: 'Install Now',
    ctaStyle: 'outline' as const,
    href: '/wallet',
  },
];

const L2_STEPS = [
  { num: '1', title: 'Event Bus', detail: 'User actions → Gami SDK → Event Bus' },
  { num: '2', title: 'AI Orchestration', detail: 'AI determines rewards & logic in real-time' },
  { num: '3', title: 'L2 Ledger Anchor', detail: 'Merkle proofs settled on-chain for verifiability' },
];

function CardIcon({ type }: { type: string }) {
  if (type === 'grid') {
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  }
  if (type === 'bolt') {
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (type === 'wallet') {
    return (
      <svg className="h-6 w-6 text-gami-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
  }
  return null;
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
              V2.0 LIVE ON TESTNET // PROTOCOL ACTIVATED
            </div>
            <h1 className="mb-8 font-display text-6xl font-bold leading-none md:text-8xl">
              THE UNIVERSAL <span className="text-gami-purple">GAMIFICATION</span> LAYER.
            </h1>
            <p className="mb-10 max-w-xl text-xl font-light leading-relaxed text-gray-400">
              Earn XP, rewards, and tokens across apps, games, and communities with one universal wallet powered by AI
              agents and blockchain infrastructure.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link
                to="/wallet"
                className="gami-gradient neo-border px-8 py-4 font-display text-lg font-bold uppercase tracking-wider shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                Launch App
              </Link>
              <Link
                to="/wallet"
                className="border-2 border-white px-8 py-4 font-display text-lg font-bold uppercase tracking-wider transition-all hover:bg-white hover:text-black"
              >
                Explore AI Agents
              </Link>
            </div>

            <div className="mt-16 flex items-center gap-8 opacity-50 grayscale">
              <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Backers & Partners</span>
              <div className="flex items-center gap-6">
                <span className="text-xl font-bold">ETHEREUM</span>
                <span className="text-xl font-bold">POLYGON</span>
                <span className="text-xl font-bold">BASE</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="token-3d relative h-64 w-64 md:h-96 md:w-96">
              <div className="gami-gradient neo-border absolute inset-0 flex rotate-12 transform items-center justify-center shadow-[0_0_50px_rgba(110,60,251,0.6)]">
                <GamiLogo className="h-32 w-32 drop-shadow-2xl" />
              </div>
              <div className="absolute -right-10 -top-10 h-20 w-20 animate-spin-slow border-2 border-gami-accent/30" />
              <div className="absolute bottom-20 -left-20 h-12 w-12 bg-gami-accent/40 blur-xl" />
              <div className="neo-border absolute left-0 top-0 animate-bounce bg-black/80 px-4 py-2 font-mono text-sm text-gami-accent">
                +500 XP
              </div>
              <div
                className="neo-border absolute bottom-10 right-0 animate-bounce bg-black/80 px-4 py-2 font-mono text-sm text-green-400"
                style={{ animationDelay: '1s' }}
              >
                $GAMI CLAIMED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Bento */}
      <section className="relative overflow-hidden border-y-4 border-black bg-black/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="mb-4 font-display text-5xl font-bold uppercase italic">The Ecosystem</h2>
              <p className="font-mono text-gray-400">/ ROOT / PRODUCTS / CORE_INFRA</p>
            </div>
            <div className="mb-4 hidden h-1 w-1/3 bg-gami-purple md:block" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {ECOSYSTEM_CARDS.map((card) => (
              <div
                key={card.title}
                className={`group bg-gami-bg p-8 neo-border shadow-brutal transition-all hover:shadow-brutal-purple ${
                  card.featured ? 'z-10 lg:scale-105' : ''
                }`}
              >
                {card.icon === 'grid' && (
                  <div className="gami-gradient neo-border mb-6 flex h-12 w-12 items-center justify-center">
                    <CardIcon type="grid" />
                  </div>
                )}
                {card.icon === 'bolt' && (
                  <div className="neo-border mb-6 flex h-12 w-12 items-center justify-center bg-white text-black">
                    <CardIcon type="bolt" />
                  </div>
                )}
                {card.icon === 'wallet' && (
                  <div className="mb-6 flex h-12 w-12 items-center justify-center border-2 border-gami-accent">
                    <CardIcon type="wallet" />
                  </div>
                )}
                <h3 className="mb-4 font-display text-2xl font-bold">{card.title}</h3>
                <p className={`mb-8 text-gray-400 ${card.icon !== 'code' ? 'h-20' : ''}`}>{card.description}</p>

                {card.code && (
                  <div className="mb-6 rounded border border-white/10 bg-black/50 p-4 font-mono text-xs text-gami-accent">
                    POST /v1/events
                    <br />
                    {'{ "action": "LEVEL_UP" }'}
                  </div>
                )}

                {card.cta && (
                  <Link
                    to={card.href}
                    className={`block w-full py-3 text-center font-display font-bold uppercase transition-all ${
                      card.ctaStyle === 'primary'
                        ? 'gami-gradient neo-border shadow-brutal hover:shadow-none'
                        : card.ctaStyle === 'purple'
                          ? 'bg-gami-purple hover:bg-gami-accent'
                          : card.ctaStyle === 'muted'
                            ? 'border-2 border-white/50 hover:border-white'
                            : 'border-2 border-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {card.cta}
                  </Link>
                )}

                {card.icon === 'wallet' && (
                  <div className="flex gap-4">
                    <Link to="/wallet" className="flex flex-1 items-center justify-center border border-white/20 py-3 hover:border-white">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.5 12c0 2.5-1.9 4.4-4.4 4.4-2.5 0-4.4-1.9-4.4-4.4 0-2.5 1.9-4.4 4.4-4.4 2.5 0 4.4 1.9 4.4 4.4z" />
                      </svg>
                    </Link>
                    <Link to="/wallet" className="flex flex-1 items-center justify-center border border-white/20 py-3 hover:border-white">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* L2 Section */}
      <section className="mx-auto grid max-w-7xl items-center gap-20 px-6 py-24 lg:grid-cols-2">
        <div>
          <h2 className="mb-8 font-display text-5xl font-bold leading-tight">
            GAMI LAYER-2 <br />
            <span className="text-outline">THE GAMING ENGINE</span>
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-gray-400">
            Gami runs on a scalable Layer-2 EVM compatible network designed specifically for high-frequency reward
            systems. We process millions of events per second with near-zero gas.
          </p>
          <div className="space-y-6">
            {L2_STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <div className="gami-gradient mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold">
                  {step.num}
                </div>
                <div>
                  <h4 className="mb-1 text-xl font-bold text-white">{step.title}</h4>
                  <p className="font-mono text-sm italic text-gray-500">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="neo-border relative z-10 bg-black p-8 shadow-brutal-purple">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="font-mono text-xs text-gami-accent">L2_METRICS_DASHBOARD</span>
            </div>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex justify-between font-mono text-xs">
                  <span>THROUGHPUT</span>
                  <span className="text-gami-accent">15,402 TPS</span>
                </div>
                <div className="neo-border h-3 w-full overflow-hidden bg-white/10">
                  <div className="gami-gradient h-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between font-mono text-xs">
                  <span>NETWORK LOAD</span>
                  <span className="text-gami-accent">OPTIMAL</span>
                </div>
                <div className="neo-border h-3 w-full overflow-hidden bg-white/10">
                  <div className="gami-gradient h-full" style={{ width: '32%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 p-4">
                  <span className="mb-1 block text-xs text-gray-500">GAS FEE (AVG)</span>
                  <span className="text-xl font-bold">$0.00001</span>
                </div>
                <div className="border border-white/10 p-4">
                  <span className="mb-1 block text-xs text-gray-500">SETTLEMENT</span>
                  <span className="text-xl font-bold">0.8s</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full border-2 border-gami-purple" />
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="relative overflow-hidden bg-gami-purple py-32">
        <div className="absolute right-0 top-0 p-20 opacity-10">
          <svg viewBox="0 0 100 100" className="h-96 w-96 fill-white">
            <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-8 font-display text-5xl font-bold uppercase italic leading-none text-black md:text-7xl">
            Power the Future of Engagement
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-black/80">
            Join the Gami token launch and help build the universal rewards economy. Early waitlist members get
            exclusive $GAMI multipliers.
          </p>

          <form action="/waitlist" className="neo-border flex flex-col gap-2 bg-black p-2 shadow-brutal md:flex-row">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent p-4 font-bold text-white outline-none placeholder:text-gray-600"
            />
            <Link
              to="/waitlist"
              className="bg-white px-10 py-4 font-display font-bold uppercase text-black transition-all hover:bg-gami-accent hover:text-white"
            >
              Join Waitlist
            </Link>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-10 font-mono font-bold text-black">
            <div className="flex flex-col">
              <span className="text-3xl">5M+</span>
              <span className="text-xs uppercase">Target Users</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl">$30B</span>
              <span className="text-xs uppercase">Market Size</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl">100+</span>
              <span className="text-xs uppercase">Partner Apps</span>
            </div>
          </div>
        </div>
      </section>

      <GamiFooter />
      <QuestNotification />
    </>
  );
}
