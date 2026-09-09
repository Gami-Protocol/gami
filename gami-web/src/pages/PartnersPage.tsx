import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';
import { StateBadge } from '@/components/gami/StateBadge';

const WHAT_PARTNERS_GET = [
  {
    title: 'One SDK instead of a rewards backend',
    body: 'Emit an event when a user does something worth rewarding. Gami handles identity, eligibility, anti-abuse, the progression record, and payout. You do not build or operate any of it.',
  },
  {
    title: 'Quests you configure, not commission',
    body: 'Define what counts and what it is worth. The rules engine decides whether an action qualifies and computes the XP owed.',
  },
  {
    title: 'Rewards that settle in stablecoins',
    body: 'Where you fund a reward, it settles in USDC or EURC on Base, sponsored by a paymaster so your users never need to hold gas or manage a seed phrase.',
  },
  {
    title: 'Users who already have a wallet',
    body: 'Sign-in through Privy creates a Base smart wallet from an email or a passkey, so onboarding does not lose people at the wallet step.',
  },
];

const HOW_TO_START = [
  {
    step: 'Read the docs',
    body: 'See how an integration is shaped and what the MCP tools do before committing to anything.',
    to: '/developers/docs',
    cta: 'Developer docs',
  },
  {
    step: 'Join the developer waitlist',
    body: 'Early SDK access, a test environment on Base Sepolia with seeded quests, and a shared channel with the engineers building the protocol.',
    to: '/waitlist',
    cta: 'Join the waitlist',
  },
  {
    step: 'Talk to us',
    body: 'For integrations that need something the docs do not cover, or a conversation before a build decision.',
    href: 'mailto:admin@gamiprotocol.io?subject=Gami%20Protocol%20partnership',
    cta: 'Email the team',
  },
];

export function PartnersPage() {
  return (
    <SiteContentPage
      eyebrow="Partners"
      title="Build loyalty into your product"
      description="Add XP, quests and stablecoin-settled rewards to your app with one SDK. Base-native, gasless, no seed phrase."
    >
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-white">What you get</h2>
        {WHAT_PARTNERS_GET.map((item) => (
          <div key={item.title} className="border-2 border-white/10 bg-black/40 p-6 neo-border">
            <h3 className="mb-3 font-display text-lg font-bold uppercase text-white">
              {item.title}
            </h3>
            <p className="leading-relaxed">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-white">Getting started</h2>
        <ol className="space-y-4">
          {HOW_TO_START.map((item, index) => (
            <li key={item.step} className="border-l-2 border-gami-purple pl-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gami-accent">
                Step {index + 1}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-white">{item.step}</h3>
              <p className="mt-2 leading-relaxed">{item.body}</p>
              {item.to ? (
                <Link
                  to={item.to}
                  className="mt-3 inline-block border-2 border-white px-5 py-2 font-display text-xs font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
                >
                  {item.cta}
                </Link>
              ) : (
                <a
                  href={item.href}
                  className="mt-3 inline-block border-2 border-white px-5 py-2 font-display text-xs font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
                >
                  {item.cta}
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4 border-2 border-white/10 bg-black/40 p-6 neo-border">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold uppercase text-white">Partner dashboard</h2>
          <StateBadge state="roadmap" />
        </div>
        <p className="leading-relaxed">
          A self-serve dashboard for keys, quest configuration and settlement reporting is in
          development and is not available yet. Until it ships, partner keys are issued by hand —
          join the waitlist or email the team and we will set you up.
        </p>
        <p className="leading-relaxed text-gray-500">
          If you already have a Gami account, you can{' '}
          <Link to="/auth" className="text-gami-accent underline-offset-2 hover:underline">
            sign in here
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Worth knowing up front</h2>
        <ul className="space-y-3">
          <li>
            XP is non-transferable. It cannot be bought, sold, transferred or redeemed, it is not
            a financial instrument, and it carries no monetary value.
          </li>
          <li>
            Rewards are funded by you, the app operator, and settle in stablecoins issued by
            authorised third parties. Gami routes them; it issues nothing and holds no client
            money. See{' '}
            <Link to="/settlement" className="text-gami-accent underline-offset-2 hover:underline">
              settlement
            </Link>
            .
          </li>
          <li>
            Base is the settlement network — chain ID 8453. Polygon and Arbitrum are read-only.
            Solana and bridging are roadmap and not available today.
          </li>
        </ul>
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
          Developer docs
        </Link>
      </div>
    </SiteContentPage>
  );
}
