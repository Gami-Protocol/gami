import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFundWallet, usePrivy } from '@privy-io/react-auth';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import { GeoBlockBanner, useGeoBlock } from '@/hooks/useGeoBlock';
import { useSaleAccount } from '@/hooks/useSaleAccount';
import { env } from '@/lib/env';
import { fetchEligibility, fetchSaleStats, type SaleEligibility, type SaleStats } from '@/lib/sale';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Strict launch gate: 0x + 40 hex chars, never the zero address. Mirrors the
 *  mobile app's tokenLaunch gate — an unset or malformed deploy variable keeps
 *  the page in its pre-launch state instead of pointing buyers at a squatter. */
function validTokenAddress(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v || !/^0x[0-9a-fA-F]{40}$/.test(v) || v.toLowerCase() === ZERO_ADDRESS) return null;
  return v;
}

function uniswapUrl(token: string): string {
  return `https://app.uniswap.org/swap?chain=base&inputCurrency=NATIVE&outputCurrency=${token}`;
}

export function RaisePage() {
  const saleLive = env.saleLive();
  const tokenAddress = validTokenAddress(env.gamiTokenAddress());
  const { blocked, loading: geoLoading } = useGeoBlock();
  const { ready, authenticated, login } = usePrivy();
  const account = useSaleAccount();
  const { fundWallet } = useFundWallet();

  const [stats, setStats] = useState<SaleStats | null>(null);
  const [eligibility, setEligibility] = useState<SaleEligibility | null>(null);
  const [funding, setFunding] = useState<'idle' | 'open' | 'error'>('idle');

  useEffect(() => {
    if (!saleLive) return;
    fetchSaleStats().then(setStats);
  }, [saleLive]);

  useEffect(() => {
    if (!saleLive || !account.address) return;
    fetchEligibility(account.address).then(setEligibility);
  }, [saleLive, account.address]);

  const live = saleLive && !blocked && !geoLoading;
  const swapReady = live && tokenAddress !== null;

  const onFund = useMemo(
    () => async () => {
      if (!account.address) return;
      setFunding('open');
      try {
        await fundWallet({ address: account.address });
        setFunding('idle');
      } catch {
        setFunding('error');
      }
    },
    [account.address, fundWallet],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="flex items-center gap-4">
        <GamiTokenLogo />
        <div>
          <h1 className="font-display text-3xl font-bold">GAMI Raise</h1>
          <p className="mt-1 text-sm text-muted">
            Utility token for the Gami Protocol loyalty network. Fixed supply, no mint, no pause,
            no blacklist, not upgradeable.
          </p>
        </div>
      </header>

      <GeoBlockBanner />

      {!saleLive && (
        <section className="mt-8 border-2 p-6">
          <h2 className="font-display text-xl font-bold">Not live yet</h2>
          <p className="mt-2 text-sm text-muted">
            The GAMI token has not launched. Nothing is for sale today, and any token claiming to
            be GAMI is not ours. Join the waitlist and we will tell you when it is real.
          </p>
          <Link
            to="/waitlist"
            className="mt-4 inline-block border-2 px-4 py-2 font-display text-sm font-bold"
          >
            Join the waitlist
          </Link>
        </section>
      )}

      {live && (
        <>
          {stats && (
            <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="border-2 p-4">
                <p className="text-xs text-muted">Raised (USD)</p>
                <p className="font-mono text-lg">{stats.total_raised_usd.toLocaleString()}</p>
              </div>
              <div className="border-2 p-4">
                <p className="text-xs text-muted">Participants</p>
                <p className="font-mono text-lg">{stats.participants_approved.toLocaleString()}</p>
              </div>
              <div className="border-2 p-4">
                <p className="text-xs text-muted">Phase</p>
                <p className="font-mono text-lg">{stats.current_phase}</p>
              </div>
            </section>
          )}

          <section className="mt-8 border-2 p-6">
            <h2 className="font-display text-xl font-bold">1 — Sign in</h2>
            {!authenticated ? (
              <button
                type="button"
                disabled={!ready}
                onClick={() => login()}
                className="mt-3 border-2 px-4 py-2 font-display text-sm font-bold"
              >
                Sign in with email or wallet
              </button>
            ) : (
              <p className="mt-3 font-mono text-sm break-all">
                Connected: {account.address ?? 'linking wallet…'}
                {account.walletLabel ? ` (${account.walletLabel})` : ''}
              </p>
            )}
            {eligibility && (
              <p className="mt-2 text-sm text-muted">
                KYC status: <span className="font-mono">{eligibility.kyc_status}</span>
              </p>
            )}
          </section>

          <section className="mt-4 border-2 p-6">
            <h2 className="font-display text-xl font-bold">2 — Fund with card or on-ramp</h2>
            <p className="mt-2 text-sm text-muted">
              Add USDC or ETH on Base to your wallet with a card or bank transfer, via Privy's
              on-ramp partners. Funds can take a few minutes to arrive.
            </p>
            <button
              type="button"
              disabled={!account.address || funding === 'open'}
              onClick={onFund}
              className="mt-3 border-2 px-4 py-2 font-display text-sm font-bold disabled:opacity-50"
            >
              {funding === 'open' ? 'Funding window open…' : 'Fund wallet'}
            </button>
            {funding === 'error' && (
              <p className="mt-2 text-sm text-red-300">
                Funding was cancelled or failed. Nothing was charged beyond what the provider shows.
              </p>
            )}
          </section>

          <section className="mt-4 border-2 p-6">
            <h2 className="font-display text-xl font-bold">3 — Swap for GAMI</h2>
            {swapReady && tokenAddress ? (
              <>
                <a
                  href={uniswapUrl(tokenAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block border-2 px-4 py-2 font-display text-sm font-bold"
                >
                  Swap on Uniswap (Base)
                </a>
                <p className="mt-3 text-xs text-muted">
                  Contract: <span className="font-mono break-all">{tokenAddress}</span> — always
                  verify this address against Gami's official channels before swapping. Name-squatted
                  tokens are the normal failure mode on launch day.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                The swap opens here the moment the token contract is deployed and verified.
              </p>
            )}
          </section>
        </>
      )}

      <section className="mt-8 border-2 border-red-500/40 p-6 text-sm text-muted">
        <h2 className="font-display text-base font-bold text-red-300">Risk disclosure</h2>
        <p className="mt-2">
          GAMI is a utility token for the Gami Protocol network. It is not an investment, carries
          no expectation of profit, and can lose all value. Nothing on this page is financial
          advice or a financial promotion. Participation is unavailable in restricted
          jurisdictions, and you are responsible for the rules that apply where you live. See our{' '}
          <Link to="/legal/terms" className="underline">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/legal/privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
      </section>

      <GamiFooter />
    </div>
  );
}
