import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

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
    href: '/app',
  },
  {
    title: 'BROWSER EXT.',
    description: 'Earn rewards while you browse. The Gami Extension will detect partner sites and log verified interactions automatically.',
    icon: 'ext',
    cta: 'Coming Soon',
    ctaStyle: 'muted' as const,
    comingSoon: true,
  },
];

const L1_STEPS = [
  {
    num: '1',
    title: 'Universal Identity',
    detail: 'One Gami handle, XP profile, and soulbound badges that travel across every partner app, game, and community.',
  },
  {
    num: '2',
    title: 'MCP Server & Client',
    detail: 'Partners emit verified actions — quests, purchases, workouts, referrals — through the Gami MCP client without building custom reward infra.',
  },
  {
    num: '3',
    title: 'On-Chain Settlement',
    detail: 'Merkle-anchored proofs settle on Base L2 for tamper-resistant claims, verifiable leaderboards, and near-zero fees.',
  },
];

const L1_LAYERS = [
  { label: 'Layer 1', name: '$GAMI', desc: 'Governance, staking, protocol fees, and treasury coordination.' },
  { label: 'Layer 2', name: 'Universal Points', desc: 'Non-transferable XP earned across quests, shopping, fitness, and referrals.' },
  { label: 'Layer 3', name: 'Stable Spend', desc: 'Auto-converted stable balance for real-world payments via Gami Wallet.' },
];

function CardIcon({ type }: { type: string }) {
  if (type === 'grid') {
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  }
  if (type === 'ext') {
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    );
  }
  return null;
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [homeEmail, setHomeEmail] = useState('');
  const [homeStatus, setHomeStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [homeMessage, setHomeMessage] = useState('');

  function handleHomeWaitlist(e: FormEvent) {
    e.preventDefault();
    setHomeStatus('loading');
    setHomeMessage('');

    const normalized = homeEmail.trim().toLowerCase();
    if (!normalized.includes('@')) {
      setHomeStatus('error');
      setHomeMessage('Enter a valid email');
      return;
    }

    // Collect remaining fields on /waitlist (name, role, wallet, company).
    const params = new URLSearchParams();
    params.set('email', normalized);
    const ref = searchParams.get('ref');
    if (ref) params.set('ref', ref);
    navigate(`/waitlist?${params.toString()}`);
  }

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
                to="/app"
                className="gami-gradient neo-border px-8 py-4 font-display text-lg font-bold uppercase tracking-wider shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                Launch App
              </Link>
              <Link
                to="/agents"
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

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {ECOSYSTEM_CARDS.map((card) => (
              <div
                key={card.title}
                className="group bg-gami-bg p-8 neo-border shadow-brutal transition-all hover:shadow-brutal-purple"
              >
                <div
                  className={`neo-border mb-6 flex h-12 w-12 items-center justify-center ${
                    card.icon === 'grid' ? 'gami-gradient' : 'border-2 border-gami-accent/50'
                  }`}
                >
                  <CardIcon type={card.icon} />
                </div>
                <h3 className="mb-4 font-display text-2xl font-bold">{card.title}</h3>
                <p className="mb-8 h-20 text-gray-400">{card.description}</p>

                {card.comingSoon ? (
                  <span className="block w-full cursor-not-allowed border-2 border-white/30 py-3 text-center font-display font-bold uppercase text-gray-500">
                    {card.cta}
                  </span>
                ) : card.cta && card.href ? (
                  <Link
                    to={card.href}
                    className={`block w-full py-3 text-center font-display font-bold uppercase transition-all ${
                      card.ctaStyle === 'outline'
                        ? 'border-2 border-white hover:bg-white hover:text-black'
                        : 'border-2 border-white/50 hover:border-white'
                    }`}
                  >
                    {card.cta}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 1 Section */}
      <section className="mx-auto grid max-w-7xl items-center gap-20 px-6 py-24 lg:grid-cols-2">
        <div>
          <div className="mb-4 inline-block border border-gami-purple bg-gami-purple/20 px-3 py-1 font-mono text-xs tracking-tighter text-gami-accent">
            PROTOCOL ARCHITECTURE
          </div>
          <h2 className="mb-8 font-display text-5xl font-bold leading-tight">
            GAMI LAYER 1 <br />
            <span className="text-outline">THE REWARDS FOUNDATION</span>
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-gray-400">
            Layer 1 is the universal gamification backbone — a shared identity, event, and settlement layer that
            lets any app plug into quests, XP, and on-chain rewards without rebuilding infrastructure from scratch.
          </p>
          <p className="mb-8 text-base leading-relaxed text-gray-500">
            Partners connect once through the Gami MCP client. User actions flow through a verified event bus, AI agents
            orchestrate quest logic and reward multipliers, and proofs anchor to Base for auditable settlement.
          </p>
          <div className="space-y-6">
            {L1_STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <div className="gami-gradient mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold">
                  {step.num}
                </div>
                <div>
                  <h4 className="mb-1 text-xl font-bold text-white">{step.title}</h4>
                  <p className="text-sm leading-relaxed text-gray-500">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-3 border-t border-white/10 pt-8">
            <p className="font-mono text-xs uppercase tracking-widest text-gami-accent">Three-Layer Stack</p>
            {L1_LAYERS.map((layer) => (
              <div key={layer.label} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <span className="w-20 shrink-0 font-mono text-xs text-gami-purple">{layer.label}</span>
                <span className="w-36 shrink-0 font-display text-sm font-bold text-white">{layer.name}</span>
                <span className="text-sm text-gray-500">{layer.desc}</span>
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
              <span className="font-mono text-xs text-gami-accent">L1_PROTOCOL_METRICS</span>
            </div>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex justify-between font-mono text-xs">
                  <span>PARTNER EVENTS / SEC</span>
                  <span className="text-gami-accent">15,402 EPS</span>
                </div>
                <div className="neo-border h-3 w-full overflow-hidden bg-white/10">
                  <div className="gami-gradient h-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between font-mono text-xs">
                  <span>QUEST VERIFICATION</span>
                  <span className="text-gami-accent">REAL-TIME</span>
                </div>
                <div className="neo-border h-3 w-full overflow-hidden bg-white/10">
                  <div className="gami-gradient h-full" style={{ width: '72%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 p-4">
                  <span className="mb-1 block text-xs text-gray-500">SETTLEMENT (BASE)</span>
                  <span className="text-xl font-bold">~0.8s</span>
                </div>
                <div className="border border-white/10 p-4">
                  <span className="mb-1 block text-xs text-gray-500">AVG GAS FEE</span>
                  <span className="text-xl font-bold">$0.00001</span>
                </div>
              </div>
              <div className="rounded border border-gami-purple/30 bg-gami-purple/10 p-4 font-mono text-xs text-gami-accent">
                MCP Client → MCP Server → AI Orchestration → L2 Ledger Anchor
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

          <form
            onSubmit={handleHomeWaitlist}
            className="neo-border flex flex-col gap-2 bg-black p-2 shadow-brutal md:flex-row"
          >
            <input
              type="email"
              name="email"
              required
              value={homeEmail}
              onChange={(e) => setHomeEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-transparent p-4 font-bold text-white outline-none placeholder:text-gray-600"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={homeStatus === 'loading'}
              className="bg-white px-10 py-4 font-display font-bold uppercase text-black transition-all hover:bg-gami-accent hover:text-white disabled:opacity-60"
            >
              {homeStatus === 'loading' ? 'Saving…' : 'Join Waitlist'}
            </button>
          </form>
          {homeMessage ? (
            <p
              className={`mt-4 font-mono text-sm ${
                homeStatus === 'error' ? 'text-red-900' : 'text-black/80'
              }`}
            >
              {homeMessage}
            </p>
          ) : null}

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
