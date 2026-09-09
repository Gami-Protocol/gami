import { Link } from 'react-router-dom';

import { GamiFooter } from '@/components/gami/GamiFooter';

const STEPS = [
  {
    title: 'Sign in with an email or a passkey',
    body: 'Privy provisions a Base smart wallet in the background. There is no seed phrase to write down and nothing to install before you start.',
  },
  {
    title: 'Or connect a wallet you already have',
    body: 'Coinbase Wallet, MetaMask, Rainbow and any WalletConnect wallet can be linked to the same Gami identity. Base is the settlement network — chain ID 8453.',
  },
  {
    title: 'Claim your .gami name',
    body: 'Register handle.gami through the Gami Name Service. It is your portable identity across quests, rewards and payments, and it resolves to your Base address.',
  },
  {
    title: 'Earn XP and collect rewards',
    body: 'Complete quests in connected apps to earn XP and badges. Reward payouts settle in USDC or EURC on Base, sponsored by a paymaster so you never hold gas.',
  },
] as const;

export function WalletGuidePage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-gami-accent">
          Wallet guide
        </p>
        <h1 className="mb-4 font-display text-4xl font-bold uppercase italic md:text-5xl">
          Set up your Gami Wallet
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-gray-400">
          Sign in with an email or a passkey, claim your <span className="text-white">.gami</span>{' '}
          name, and start earning XP. Base-native, gasless, no seed phrase.
        </p>

        <ol className="space-y-6">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="border-2 border-white/10 bg-black/40 p-6 neo-border"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-gami-accent">
                Step {index + 1}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold uppercase">{step.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/wallet"
            className="gami-gradient neo-border px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider"
          >
            Open Gami Wallet →
          </Link>
          <Link
            to="/settlement"
            className="border-2 border-white px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black"
          >
            How rewards settle
          </Link>
          <Link
            to="/waitlist"
            className="border-2 border-white/30 px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider text-gray-300 hover:border-white"
          >
            Join the waitlist
          </Link>
        </div>

        <p className="mt-8 font-mono text-[11px] uppercase leading-relaxed text-gray-500">
          XP is non-transferable and carries no monetary value. Reward settlement in USDC and EURC
          on Base is in development and is not yet generally available.
        </p>
      </div>
      <GamiFooter />
    </>
  );
}
