import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { GamiFooter } from '@/components/gami/GamiFooter';

const STATS = [
  { label: 'Market Size', value: '$30B', sub: 'BY 2026 PROJECTED' },
  { label: 'Target Users', value: '5M+', sub: 'GLOBAL ECOSYSTEM' },
  { label: 'Revenue Target', value: '$5M', sub: 'YEAR 1 PROJECTED' },
];

const UTILITIES = [
  {
    icon: 'xp',
    title: 'XP Multipliers',
    description: 'Stake $GAMI to boost your XP earning rate by up to 5x across all partner applications and games.',
  },
  {
    icon: 'gov',
    title: 'Governance',
    description: 'Propose and vote on protocol parameters, including reward distribution weights and new chain integrations.',
  },
  {
    icon: 'pool',
    title: 'Reward Pools',
    description: 'Participate in exclusive quest pools that only accept $GAMI holders, featuring high-value NFT and token drops.',
  },
  {
    icon: 'premium',
    title: 'Premium Features',
    description: 'Access advanced AI agent tools for developers and high-tier analytics for professional reward hunters.',
  },
];

const PHASES = [
  {
    num: '01',
    title: 'Whitelist & Testing',
    description: 'Current Phase. Community members sign up for the whitelist and participate in the incentivized testnet to earn early multipliers.',
    active: true,
  },
  {
    num: '02',
    title: 'Private Genesis Sale',
    description: 'Early backers and strategic partners gain access to the initial $GAMI genesis event. Minimum lock-up periods apply.',
    active: false,
  },
  {
    num: '03',
    title: 'Public Protocol Launch',
    description: 'Token becomes publicly available. Liquidity pools open on Uniswap and major Layer-2 DEXs.',
    active: false,
  },
];

function UtilityIcon({ type }: { type: string }) {
  if (type === 'xp') {
    return <span className="font-display font-bold">XP</span>;
  }
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
  return (
    <svg className="h-6 w-6 text-gami-accent" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  );
}

export function WaitlistPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [walletLinked, setWalletLinked] = useState(false);
  const [loading, setLoading] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const displayAddress = isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <>
      <div className="flex-grow pt-24 lg:pt-32">
        {/* Hero */}
        <section className="mx-auto mb-20 max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="pt-10 lg:col-span-7">
              <div className="mb-8 inline-flex items-center gap-2 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-black">
                <span className="animate-pulse text-red-600">●</span> Phase 1: Waitlist Registration
              </div>
              <h1 className="mb-8 font-display text-5xl font-bold uppercase italic leading-[0.9] md:text-8xl">
                Power the <br />
                <span className="glow-text text-gami-purple">Future</span> of Engagement.
              </h1>
              <p className="mb-12 max-w-xl text-xl font-light leading-relaxed text-gray-400">
                Join the $GAMI token launch and help build the universal rewards economy. Early adopters gain priority
                access to the token sale and permanent XP multipliers.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="group border-2 border-white/10 bg-black/40 p-6 neo-border transition-all hover:border-gami-purple"
                  >
                    <span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-500">{stat.label}</span>
                    <span className="block font-display text-4xl font-bold transition-colors group-hover:text-gami-purple">
                      {stat.value}
                    </span>
                    <span className="mt-2 block font-mono text-[10px] tracking-tighter text-gami-accent">{stat.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="relative lg:col-span-5">
              <div className="absolute -right-10 -top-10 -z-10 h-64 w-64 bg-gami-purple/30 blur-[100px]" />

              <div className="relative overflow-hidden border-4 border-black bg-gami-bg p-8 neo-border shadow-brutal-purple">
                {formSubmitted ? (
                  <div className="py-12 text-center">
                    <div className="gami-gradient neo-border mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                      <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="mb-4 font-display text-3xl font-bold">YOU&apos;RE IN!</h3>
                    <p className="mb-8 text-gray-400">
                      Verification link sent to your email. Check your inbox to confirm your spot.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="w-full border-2 border-white py-4 font-display font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
                    >
                      Back to Home
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="font-display text-2xl font-bold uppercase italic">ICO Waitlist</h2>
                      <div className="bg-gami-purple px-3 py-1 font-mono text-[10px] font-bold uppercase">LIVE</div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          Full Name
                        </label>
                        <input type="text" placeholder="GAMI PILOT" required className="form-input" />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          Email Address
                        </label>
                        <input type="email" placeholder="PILOT@GAMIPROTOCOL.COM" required className="form-input" />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          Wallet Address (Optional)
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
                      </div>

                      <button
                        type="submit"
                        className="gami-gradient w-full py-5 font-display text-xl font-bold uppercase tracking-widest neo-border shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                      >
                        Join Waitlist
                      </button>

                      <p className="text-center font-mono text-[10px] leading-tight text-gray-500">
                        BY JOINING, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
                        <br />
                        EARLY ACCESS IS NOT GUARANTEED.
                      </p>
                    </form>
                  </>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <div className="flex-1 border border-white/10 bg-black/40 p-4 font-mono">
                  <span className="block text-[10px] uppercase text-gray-600">Referral Code</span>
                  <span className="text-sm font-bold text-gami-accent">GAMI-LAUNCH-2024</span>
                </div>
                <div className="flex-1 border border-white/10 bg-black/40 p-4 font-mono">
                  <span className="block text-[10px] uppercase text-gray-600">Spots Left</span>
                  <span className="text-sm font-bold text-white">1,402 / 5,000</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Token Utility */}
        <section className="relative border-y-4 border-black bg-black/60 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-20 text-center">
              <h2 className="mb-6 font-display text-4xl font-bold uppercase italic md:text-6xl">Token Utility</h2>
              <p className="font-mono uppercase tracking-tighter text-gray-400">
                $GAMI powers every interaction within the Gami Protocol ecosystem.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {UTILITIES.map((item) => (
                <div key={item.title} className="group border-2 border-white/5 p-8 transition-all hover:border-gami-purple">
                  <div
                    className={`mb-6 flex h-12 w-12 items-center justify-center neo-border ${
                      item.icon === 'xp'
                        ? 'gami-gradient'
                        : item.icon === 'gov'
                          ? 'border-2 border-white'
                          : item.icon === 'pool'
                            ? 'bg-gami-accent'
                            : 'border-2 border-gami-accent'
                    }`}
                  >
                    <UtilityIcon type={item.icon} />
                  </div>
                  <h4 className="mb-4 font-display text-xl font-bold transition-colors group-hover:text-gami-accent">
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col gap-20 lg:flex-row">
            <div className="lg:w-1/3">
              <h2 className="mb-8 font-display text-5xl uppercase italic leading-none">
                The <span className="text-outline">Launch</span> Timeline
              </h2>
              <p className="font-mono text-sm leading-loose text-gray-500">
                We are following a strategic phased roll-out to ensure protocol stability and fair token distribution
                among our core community members.
              </p>
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
