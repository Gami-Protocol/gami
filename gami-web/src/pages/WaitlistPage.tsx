import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import {
  ALLOCATION_ROWS,
  DUAL_TOKEN,
  FLYWHEEL_EMISSIONS,
  FLYWHEEL_SINKS,
  ICO_STATS,
  PHASES,
  UTILITIES,
} from '@/data/ico-tokenomics';
import { isFirebaseConfigured } from '@/lib/firebase';
import { subscribeWaitlistCount } from '@/lib/firebase-waitlist-stats';
import { joinWaitlist } from '@/lib/sale';

const WAITLIST_CAP = 5000;

function UtilityIcon({ type }: { type: string }) {
  if (type === 'xp') return <span className="font-display font-bold">XP</span>;
  if (type === 'gov') {
    return (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
      </svg>
    );
  }
  if (type === 'pool') {
    return (
      <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
      </svg>
    );
  }
  if (type === 'fee') {
    return <span className="font-display text-sm font-bold">%</span>;
  }
  if (type === 'stake') {
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-gami-accent" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  );
}

function iconBoxClass(icon: string): string {
  if (icon === 'xp') return 'gami-gradient neo-border';
  if (icon === 'gov') return 'border-2 border-white neo-border';
  if (icon === 'pool') return 'bg-gami-accent neo-border';
  if (icon === 'fee') return 'border-2 border-gami-purple neo-border';
  if (icon === 'stake') return 'gami-gradient neo-border';
  return 'border-2 border-gami-accent neo-border';
}

export function WaitlistPage() {
  const [searchParams] = useSearchParams();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [walletLinked, setWalletLinked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '');
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const referralCode = searchParams.get('ref') ?? undefined;
  const displayAddress = isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return subscribeWaitlistCount((stats) => setWaitlistCount(stats.count));
  }, []);

  useEffect(() => {
    document.title = 'GAMI ICO Launchpad — $GAMI Tokenomics & Genesis';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Fixed supply. Community-first. XP-driven. Join the $GAMI ICO waitlist for priority access, multipliers, and governance rights.',
      );
    }
    return () => {
      document.title = 'Gami Protocol — Universal Gamification Infrastructure';
      if (meta) {
        meta.setAttribute(
          'content',
          "Earn XP, rewards, and tokens across apps and games using Gami Protocol's AI-powered gamification engine.",
        );
      }
    };
  }, []);

  const handleConnect = () => {
    if (isConnected) {
      setWalletLinked(false);
      disconnect();
      return;
    }
    setLoading(true);
    const connector = connectors[0];
    if (connector) {
      connect(
        { connector },
        {
          onSettled: () => {
            setLoading(false);
            setWalletLinked(true);
          },
        },
      );
    } else {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await joinWaitlist({
      email,
      full_name: fullName,
      wallet_address: isConnected && address ? address : undefined,
      referral_code: referralCode,
      source: 'web',
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? 'Failed to join waitlist. Please try again.');
      return;
    }

    setFormSubmitted(true);
  };

  return (
    <>
      <div className="flex-grow pt-24 lg:pt-32">
        {/* Hero + Waitlist */}
        <section className="mx-auto mb-20 max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="pt-10 lg:col-span-7">
              <GamiTokenLogo className="mb-6 h-16 w-16 neo-border" />
              <div className="mb-8 inline-flex items-center gap-2 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-black">
                <span className="animate-pulse text-red-600">●</span> Phase 1: Waitlist Open
              </div>
              <h1 className="mb-8 font-display text-5xl font-bold uppercase italic leading-[0.9] md:text-8xl">
                $GAMI <br />
                <span className="glow-text text-gami-purple">GENESIS</span>
              </h1>
              <p className="mb-12 max-w-xl text-xl font-light leading-relaxed text-gray-400">
                Fixed 1B supply. 40% community. XP-driven emissions. Join the waitlist for priority allocation in the
                $GAMI ICO and permanent multipliers.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {ICO_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="group border-2 border-white/10 bg-black/40 p-6 neo-border transition-all hover:border-gami-purple"
                  >
                    <span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-500">
                      {stat.label}
                    </span>
                    <span className="block font-display text-4xl font-bold transition-colors group-hover:text-gami-purple">
                      {stat.value}
                    </span>
                    <span className="mt-2 block font-mono text-[10px] tracking-tighter text-gami-accent">{stat.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:col-span-5" id="waitlist">
              <div className="absolute -right-10 -top-10 -z-10 h-64 w-64 bg-gami-purple/30 blur-[100px]" />

              <div className="relative overflow-hidden border-4 border-black bg-gami-bg p-8 neo-border shadow-brutal-purple">
                {formSubmitted ? (
                  <div className="py-12 text-center">
                    <div className="gami-gradient neo-border mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                      <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="mb-4 font-display text-3xl font-bold">YOU&apos;RE IN THE GENESIS!</h3>
                    <p className="mb-8 text-gray-400">
                      You&apos;re saved to the waitlist database
                      {isConnected && address
                        ? ` with wallet ${displayAddress} for TGE distribution.`
                        : '. Connect a wallet anytime to lock in your claim address.'}{' '}
                      Early waitlist = higher allocation priority &amp; XP multipliers.
                    </p>
                    <Link
                      to="/sale/contribute"
                      className="mb-4 block w-full gami-gradient py-4 text-center font-display font-bold uppercase tracking-widest neo-border shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                    >
                      Continue to Sale
                    </Link>
                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="w-full border-2 border-white py-4 font-display font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
                    >
                      Back
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="font-display text-2xl font-bold uppercase italic">$GAMI ICO Waitlist</h2>
                      <div className="bg-gami-purple px-3 py-1 font-mono text-[10px] font-bold uppercase">LIVE</div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="GAMI PILOT"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="form-input"
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="PILOT@GAMIPROTOCOL.COM"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-input"
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          Wallet Address (Recommended for TGE)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={walletLinked || isConnected ? displayAddress : ''}
                            placeholder="0X..."
                            readOnly
                            className="form-input pr-24"
                          />
                          <button
                            type="button"
                            onClick={handleConnect}
                            className="absolute bottom-2 right-2 top-2 bg-white px-3 font-display text-[10px] font-bold uppercase text-black transition-all hover:bg-gami-accent hover:text-white"
                          >
                            {walletLinked || isConnected ? 'LINKED' : 'CONNECT'}
                          </button>
                        </div>
                        <p className="mt-2 font-mono text-[10px] text-gray-600">
                          Link your wallet so we can distribute $GAMI to you at TGE.
                        </p>
                      </div>

                      {error ? (
                        <p className="border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300">
                          {error}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="gami-gradient w-full py-5 font-display text-xl font-bold uppercase tracking-widest neo-border shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'Saving…' : 'Secure Spot'}
                      </button>

                      <p className="text-center font-mono text-[10px] leading-tight text-gray-500">
                        EARLY JOINERS RECEIVE PRIORITY ALLOCATION + LIFETIME XP MULTIPLIERS
                      </p>
                    </form>
                  </>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <div className="flex-1 border border-white/10 bg-black/40 p-4 font-mono">
                  <span className="block text-[10px] uppercase text-gray-600">On Waitlist</span>
                  <span className="text-sm font-bold text-gami-accent">
                    {waitlistCount == null ? '—' : waitlistCount.toLocaleString()}
                    <span className="text-gray-500"> / {WAITLIST_CAP.toLocaleString()}</span>
                  </span>
                </div>
                <Link
                  to="/waitlist/live"
                  className="flex-1 border border-white/10 bg-black/40 p-4 font-mono transition-colors hover:border-gami-accent"
                >
                  <span className="block text-[10px] uppercase text-gray-600">Live alerts</span>
                  <span className="text-sm font-bold text-white">Email me updates →</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Token & Funnel */}
        <section className="relative border-y-4 border-black bg-black/60 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-6 font-display text-4xl font-bold uppercase italic md:text-6xl">
                Dual-Token Architecture
              </h2>
              <p className="mx-auto max-w-2xl font-mono text-sm uppercase tracking-tighter text-gray-400">
                Effort is soulbound. Value is transferable. The funnel is the anti-inflation valve.
              </p>
            </div>

            <div className="mb-12 grid gap-8 lg:grid-cols-2">
              {[DUAL_TOKEN.xp, DUAL_TOKEN.gami].map((token) => (
                <div
                  key={token.label}
                  className="border-2 border-white/10 bg-gami-bg p-8 neo-border shadow-brutal transition-all hover:border-gami-purple hover:shadow-brutal-purple"
                >
                  <h3 className="mb-6 font-display text-2xl font-bold uppercase italic text-gami-accent">
                    {token.label}
                  </h3>
                  <dl className="space-y-4 font-mono text-sm">
                    <div>
                      <dt className="text-[10px] uppercase tracking-widest text-gray-500">Type</dt>
                      <dd className="mt-1 text-white">{token.type}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-widest text-gray-500">Purpose</dt>
                      <dd className="mt-1 text-gray-400">{token.purpose}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-widest text-gray-500">Supply</dt>
                      <dd className="mt-1 text-white">{token.supply}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-widest text-gray-500">Where it lives</dt>
                      <dd className="mt-1 text-gray-400">{token.where}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <div className="gami-gradient neo-border mx-auto max-w-3xl p-8 text-center shadow-brutal-purple">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">Conversion Funnel</p>
              <p className="mt-4 font-display text-2xl font-bold uppercase italic md:text-3xl">
                XP → Gami Points → $GAMI
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Sustained, verified engagement converts into Gami Points, which graduate into $GAMI under
                protocol-controlled rates. Emission into the liquid token is throttled by real activity — not time
                alone.
              </p>
            </div>
          </div>
        </section>

        {/* Token Allocation */}
        <section id="tokenomics" className="relative overflow-hidden border-y-4 border-black bg-black/80 py-24">
          <div className="absolute right-0 top-0 h-96 w-96 bg-gami-purple/10 blur-[120px]" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gami-accent">Supply & Allocation</p>
                <h2 className="font-display text-4xl font-bold uppercase italic md:text-6xl">1B Fixed Supply</h2>
                <p className="mt-4 max-w-xl text-gray-400">
                  40% to community is deliberately the largest bucket — signaling a utility network, not an
                  insider-heavy raise.
                </p>
              </div>
              <div className="border-2 border-gami-purple bg-gami-purple/10 p-6 neo-border">
                <span className="block font-mono text-[10px] uppercase text-gray-500">Community-First Thesis</span>
                <span className="font-display text-3xl font-bold text-gami-accent">40%</span>
                <span className="block font-mono text-xs text-gray-400">400M tokens · 5yr linear</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse font-mono text-sm">
                <thead>
                  <tr className="border-b-2 border-gami-purple text-left text-xs uppercase tracking-widest text-gami-accent">
                    <th className="p-4">Allocation</th>
                    <th className="p-4">%</th>
                    <th className="p-4">Tokens</th>
                    <th className="p-4">Vesting</th>
                    <th className="p-4">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {ALLOCATION_ROWS.map((row) => (
                    <tr key={row.bucket} className="border-b border-white/10 transition-colors hover:bg-white/5">
                      <td className="p-4 font-display font-bold text-white">{row.bucket}</td>
                      <td className="p-4 text-gami-accent">{row.percent}%</td>
                      <td className="p-4 text-gray-300">{row.tokens}</td>
                      <td className="p-4 text-gray-400">{row.vesting}</td>
                      <td className="p-4 text-gray-500">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-3">
              {ALLOCATION_ROWS.map((row) => (
                <div key={`bar-${row.bucket}`} className="flex items-center gap-4">
                  <span className="w-48 shrink-0 truncate font-mono text-[10px] uppercase text-gray-500">
                    {row.bucket}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden bg-white/10 neo-border">
                    <div
                      className="progress-bar-clip gami-gradient h-full transition-all"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="w-10 font-mono text-xs text-gami-accent">{row.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Utility & Staking */}
        <section className="relative border-y-4 border-black bg-black/60 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-20 text-center">
              <h2 className="mb-6 font-display text-4xl font-bold uppercase italic md:text-6xl">Why $GAMI Matters</h2>
              <p className="font-mono uppercase tracking-tighter text-gray-400">Utility. Governance. Alignment.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {UTILITIES.map((item) => (
                <div
                  key={item.title}
                  className="group border-2 border-white/5 p-8 transition-all hover:border-gami-purple hover:shadow-brutal-purple"
                >
                  <div className={`mb-6 flex h-12 w-12 items-center justify-center ${iconBoxClass(item.icon)}`}>
                    <UtilityIcon type={item.icon} />
                  </div>
                  <h4 className="mb-4 font-display text-xl font-bold transition-colors group-hover:text-gami-accent">
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 border-2 border-gami-purple bg-gami-purple/5 p-8 neo-border">
              <h3 className="mb-4 font-display text-2xl font-bold uppercase italic">Staking Target</h3>
              <p className="max-w-3xl text-gray-400">
                Staking is the principal sink and alignment mechanism. Staked $GAMI earns emissions share, raises XP
                multipliers, and confers governance weight. The protocol targets{' '}
                <span className="font-bold text-gami-accent">&gt;50% of circulating supply</span> staked at steady
                state.
              </p>
            </div>
          </div>
        </section>

        {/* Value Accrual Flywheel */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-6 font-display text-4xl font-bold uppercase italic md:text-5xl">Value Accrual Flywheel</h2>
            <p className="font-mono text-sm uppercase tracking-tighter text-gray-400">
              Sinks vs emissions — real activity drives demand
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="border-2 border-gami-accent/30 bg-black/40 p-8 neo-border shadow-brutal">
              <h3 className="mb-6 font-display text-xl font-bold uppercase text-gami-accent">Demand / Sinks</h3>
              <ul className="space-y-4">
                {FLYWHEEL_SINKS.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-mono text-sm text-gray-300">
                    <span className="text-gami-accent">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-2 border-white/20 bg-black/40 p-8 neo-border">
              <h3 className="mb-6 font-display text-xl font-bold uppercase text-gray-400">Supply / Emission</h3>
              <ul className="space-y-4">
                {FLYWHEEL_EMISSIONS.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-mono text-sm text-gray-500">
                    <span className="text-gray-600">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-12 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
            Partner-funded pools create net buy-side demand independent of protocol emissions
          </p>
        </section>

        {/* Roadmap */}
        <section className="border-t-4 border-black bg-black/40 py-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-20 px-6 lg:flex-row">
            <div className="lg:w-1/3">
              <h2 className="mb-8 font-display text-5xl uppercase italic leading-none">
                Launch <span className="text-outline">Phases</span>
              </h2>
              <p className="font-mono text-sm leading-loose text-gray-500">
                Strategic phased roll-out ensures protocol stability and fair distribution among core community members.
              </p>
              <Link
                to="/sale"
                className="mt-8 inline-block border-2 border-white px-6 py-3 font-display text-xs font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
              >
                View Token Raise
              </Link>
            </div>
            <div className="space-y-12 lg:w-2/3">
              {PHASES.map((phase) => (
                <div key={phase.num} className="relative flex gap-8">
                  <div
                    className={`flex h-16 w-16 flex-shrink-0 items-center justify-center font-display text-2xl font-bold neo-border ${
                      phase.active ? 'bg-white text-black' : 'border-white/20 text-white/20'
                    }`}
                  >
                    {phase.num}
                  </div>
                  <div className="pt-2">
                    <h3
                      className={`mb-2 font-display text-2xl font-bold uppercase italic ${
                        phase.active ? 'text-gami-accent' : ''
                      }`}
                    >
                      {phase.title}
                    </h3>
                    <p className={phase.active ? 'text-gray-400' : 'text-gray-500'}>{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <GamiFooter variant="ico" />

      {(loading || isPending) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm border-4 border-black bg-gami-bg p-12 text-center neo-border shadow-brutal-purple">
            <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-4 border-black border-t-gami-purple" />
            <h3 className="mb-2 font-display text-2xl font-bold uppercase italic tracking-widest">Connecting...</h3>
            <p className="font-mono text-xs text-gray-500">AWAITING HANDSHAKE FROM WALLET PROVIDER</p>
          </div>
        </div>
      )}
    </>
  );
}
