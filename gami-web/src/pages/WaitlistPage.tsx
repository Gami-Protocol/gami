import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';
import { WaitlistSetupBanner } from '@/components/waitlist/WaitlistSetupBanner';
import { fetchWaitlistPublicCount } from '@/lib/waitlist';

const WHAT_YOU_GET = [
  {
    title: 'Early SDK access',
    body: 'Keys for the Gami SDK and the MCP client, plus the integration guide, before general availability.',
  },
  {
    title: 'A test environment',
    body: 'A sandbox on Base Sepolia with seeded quests and test settlement, so you can wire up an integration end to end.',
  },
  {
    title: 'Direct support',
    body: 'A shared channel with the engineers building the protocol while you integrate.',
  },
  {
    title: 'Release notes that matter',
    body: 'Breaking changes, new MCP tools and settlement updates — sent when they ship, not on a schedule.',
  },
] as const;

export function WaitlistPage() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    void fetchWaitlistPublicCount().then((n) => {
      if (n != null) setWaitlistCount(n);
    });
  }, []);

  return (
    <>
      <div className="flex-grow pt-24 lg:pt-32">
        <section className="mx-auto mb-20 max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="pt-10 lg:col-span-7">
              <div className="mb-8 inline-flex items-center gap-2 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-black">
                <span className="animate-pulse text-red-600">●</span> Developer waitlist open
              </div>

              <h1 className="mb-8 font-display text-5xl font-bold uppercase italic leading-[0.9] md:text-7xl">
                BUILD ON <br />
                <span className="glow-text text-gami-purple">GAMI</span>
              </h1>

              <p className="mb-10 max-w-xl text-xl font-light leading-relaxed text-gray-400">
                One SDK adds XP, quests and stablecoin-settled rewards to your app. Join the
                developer waitlist for early access to the SDK, a test environment on Base, and
                support while you integrate.
              </p>

              {waitlistCount != null ? (
                <p className="mb-10 font-mono text-xs uppercase tracking-widest text-gami-accent">
                  {waitlistCount.toLocaleString()} developers and teams on the list
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {WHAT_YOU_GET.map((item) => (
                  <div
                    key={item.title}
                    className="border-2 border-white/10 bg-black/40 p-6 neo-border transition-all hover:border-gami-purple"
                  >
                    <h2 className="mb-2 font-display text-lg font-bold uppercase">{item.title}</h2>
                    <p className="text-sm leading-relaxed text-gray-400">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:col-span-5" id="waitlist">
              <div className="absolute -right-10 -top-10 -z-10 h-64 w-64 bg-gami-purple/30 blur-[100px]" />

              <div className="relative overflow-hidden border-4 border-black bg-gami-bg p-8 neo-border shadow-brutal-purple">
                <WaitlistSetupBanner />
                <WaitlistForm />
              </div>

              <p className="mt-6 font-mono text-[11px] uppercase leading-relaxed text-gray-500">
                This is a product waitlist for developers. It is not an offer, a sale, or a
                registration of interest in any investment, and it confers no entitlement of any
                kind.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-24 max-w-7xl px-6">
          <div className="border-2 border-white/10 bg-black/40 p-8 neo-border md:p-12">
            <h2 className="mb-4 font-display text-3xl font-bold uppercase italic">
              What Gami actually does
            </h2>
            <p className="mb-6 max-w-3xl text-gray-400">
              Your app emits an event when a user does something worth rewarding. Gami decides
              whether it qualifies, computes the XP or reward owed, and settles it onchain. You
              write the rule; the protocol handles identity, verification and payout.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/developers/docs"
                className="gami-gradient neo-border px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider"
              >
                Read the docs →
              </Link>
              <Link
                to="/settlement"
                className="border-2 border-white px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black"
              >
                How settlement works
              </Link>
            </div>
          </div>
        </section>
      </div>
      <GamiFooter />
    </>
  );
}
