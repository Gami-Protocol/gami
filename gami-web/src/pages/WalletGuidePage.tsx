import { Link } from 'react-router-dom';

import { GamiFooter } from '@/components/gami/GamiFooter';
import {
  MAX_CONTRIBUTION_GBP,
  MIN_CONTRIBUTION_GBP,
  formatGbp,
  maxContributionUsdc,
  minContributionUsdc,
} from '@/lib/sale-limits';

const STEPS = [
  {
    title: 'Add your wallet',
    body: 'Sign in on the raise page with email, Coinbase Wallet, MetaMask, Rainbow, WalletConnect, Phantom, or Solflare. Privy creates a Base allocation wallet when you use email.',
  },
  {
    title: 'Fund with crypto or card',
    body: 'Pay with ETH, USDT, or other crypto via Uniswap → USDC for raise allocation, or use Coinbase / card. Get $GAMI on Uniswap (EVM first), then Raydium and Jupiter on Solana — addresses from gami-protocol-chain.',
  },
  {
    title: 'Invest within limits',
    body: `Contribute between ${formatGbp(MIN_CONTRIBUTION_GBP)} and ${formatGbp(MAX_CONTRIBUTION_GBP)} (about ${minContributionUsdc()}–${maxContributionUsdc()} USDC). Your $GAMI allocation updates live as you enter an amount.`,
  },
  {
    title: 'Claim your Gami Name (GNS)',
    body: 'Open the Gami Wallet to register your handle.gami domain via Gami Name Service — your portable identity for payments, quests, and allocation receipts.',
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
          Get tokens allocated
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-gray-400">
          Link a wallet, fund with Coinbase or card, invest {formatGbp(MIN_CONTRIBUTION_GBP)}–
          {formatGbp(MAX_CONTRIBUTION_GBP)}, and claim your <span className="text-white">.gami</span>{' '}
          name in the Gami Wallet.
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
            to="/sale"
            className="gami-gradient neo-border px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider"
          >
            Open raise card →
          </Link>
          <Link
            to="/wallet"
            className="border-2 border-white px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black"
          >
            Open Gami Wallet / GNS
          </Link>
          <Link
            to="/waitlist"
            className="border-2 border-white/30 px-6 py-4 text-center font-display text-sm font-bold uppercase tracking-wider text-gray-300 hover:border-white"
          >
            Join waitlist
          </Link>
        </div>

        <p className="mt-8 font-mono text-[11px] uppercase leading-relaxed text-gray-500">
          Sale settles in USDC on Base. Solana card purchases fund Solana wallets — bridge or swap to
          your Base allocation wallet before confirming a contribution.
        </p>
      </div>
      <GamiFooter />
    </>
  );
}
