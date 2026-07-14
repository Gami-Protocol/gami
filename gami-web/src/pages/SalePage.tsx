import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { formatUnits } from 'viem';

import { ConnectWallet } from '@/components/ConnectWallet';
import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import { useGeoBlock } from '@/hooks/useGeoBlock';
import { useSaleAccount } from '@/hooks/useSaleAccount';
import {
  TOKEN_SALE_ABI,
  USDC_ABI,
  getChainId,
  getContractAddress,
  getExplorerTxUrl,
  phaseFromIndex,
} from '@/lib/contracts';
import {
  fetchEligibility,
  fetchSaleStats,
  isSaleConfigured,
  parseStablecoinAmount,
  previewGamiAllocation,
  type SaleEligibility,
  type SaleStats,
} from '@/lib/sale';
import { env } from '@/lib/env';

const CONFIGURED_CAP = 2_160_000;
const CONFIGURED_PRICE = 0.012;
const MIN_CONTRIBUTION = 500;
const USDC_DECIMALS = 6;

type PaymentMethod = 'usdc' | 'usdt' | 'fiat';

const BENEFITS = [
  '1.5x XP Multiplier at TGE',
  'Governance voting power',
  'Priority access to AI Agent tools',
];

function walletErrorMessage(error: Error): string {
  if ('shortMessage' in error && typeof error.shortMessage === 'string') {
    return error.shortMessage;
  }
  return error.message;
}

export function SalePage() {
  const { address, isConnected, isLinking, authenticated, ready: walletReady } = useSaleAccount();
  const connectedChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { blocked: geoBlocked, country, loading: geoLoading } = useGeoBlock();
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [eligibility, setEligibility] = useState<SaleEligibility | null>(null);
  const [amount, setAmount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('usdc');
  const [pendingAmount, setPendingAmount] = useState<bigint | null>(null);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const saleAddress = getContractAddress('TOKEN_SALE');
  const usdcAddress = getContractAddress('USDC');
  const saleConfigured = isSaleConfigured();
  const saleLive = env.saleLive() && saleConfigured;
  const requiredChainId = getChainId();
  const wrongNetwork = isConnected && connectedChainId !== requiredChainId;
  const fiatOnrampUrl = env.fiatOnrampUrl();
  const usdtSwapUrl = env.usdtSwapUrl();
  const privyConfigured = Boolean(env.privyAppId());

  const { data: onChainRaised } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'totalRaised',
    query: { enabled: Boolean(saleAddress), refetchInterval: 15_000 },
  });

  const { data: hardCapRaw } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'hardCap',
    query: { enabled: Boolean(saleAddress), refetchInterval: 15_000 },
  });

  const { data: pricePerToken } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'pricePerToken',
    query: { enabled: Boolean(saleAddress), refetchInterval: 15_000 },
  });

  const { data: phaseIndex } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'currentPhase',
    query: { enabled: Boolean(saleAddress), refetchInterval: 15_000 },
  });

  const { data: perWalletCapRaw } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'perWalletCap',
    query: { enabled: Boolean(saleAddress), refetchInterval: 15_000 },
  });

  const { data: walletContributedRaw, refetch: refetchWalletContributed } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'contributed',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(saleAddress && address), refetchInterval: 15_000 },
  });

  const { data: walletAllocationRaw, refetch: refetchWalletAllocation } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'allocation',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(saleAddress && address), refetchInterval: 15_000 },
  });

  const { data: usdcBalanceRaw, refetch: refetchUsdcBalance } = useReadContract({
    address: usdcAddress ?? undefined,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(usdcAddress && address), refetchInterval: 15_000 },
  });

  const { data: usdcAllowanceRaw, refetch: refetchUsdcAllowance } = useReadContract({
    address: usdcAddress ?? undefined,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && saleAddress ? [address, saleAddress] : undefined,
    query: { enabled: Boolean(usdcAddress && saleAddress && address), refetchInterval: 15_000 },
  });

  const {
    writeContract: approveUsdc,
    data: approvalHash,
    isPending: isApproving,
    reset: resetApproval,
  } = useWriteContract();
  const {
    writeContract: contribute,
    data: contributionHash,
    isPending: isContributing,
    reset: resetContribution,
  } = useWriteContract();
  const { isSuccess: approvalConfirmed } = useWaitForTransactionReceipt({ hash: approvalHash });
  const { isSuccess: contributionConfirmed } = useWaitForTransactionReceipt({
    hash: contributionHash,
  });

  const refreshEligibility = useCallback(async () => {
    if (!address) {
      setEligibility(null);
      return;
    }
    setEligibility(await fetchEligibility(address));
  }, [address]);

  useEffect(() => {
    const refreshStats = () => void fetchSaleStats().then(setStats);
    refreshStats();
    const timer = window.setInterval(refreshStats, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void refreshEligibility();
  }, [refreshEligibility]);

  const usdcAmount = useMemo(() => parseStablecoinAmount(amount, USDC_DECIMALS), [amount]);

  const tokenAmount = useMemo(() => {
    if (pricePerToken && usdcAmount) {
      return Number(formatUnits(previewGamiAllocation(usdcAmount, pricePerToken as bigint), 18));
    }
    const numericAmount = Number(amount);
    return Number.isFinite(numericAmount) ? numericAmount / CONFIGURED_PRICE : 0;
  }, [amount, pricePerToken, usdcAmount]);

  useEffect(() => {
    if (!approvalConfirmed || !saleAddress || !address || contributionHash || !pendingAmount) {
      return;
    }

    setMessage('Approval confirmed. Confirm the contribution in your wallet.');
    contribute(
      {
        address: saleAddress,
        abi: TOKEN_SALE_ABI,
        functionName: 'contributeUSDC',
        args: [pendingAmount, eligibility?.merkle_proof ?? []],
      },
      {
        onError: (error) => setMessage(walletErrorMessage(error)),
      },
    );
  }, [
    address,
    approvalConfirmed,
    contribute,
    contributionHash,
    eligibility,
    saleAddress,
    pendingAmount,
  ]);

  useEffect(() => {
    if (!contributionConfirmed) return;
    setShowSuccess(true);
    setMessage('');
    setPendingAmount(null);
    void refreshEligibility();
    void fetchSaleStats().then(setStats);
    void refetchWalletContributed();
    void refetchWalletAllocation();
    void refetchUsdcBalance();
    void refetchUsdcAllowance();
  }, [
    contributionConfirmed,
    refreshEligibility,
    refetchUsdcAllowance,
    refetchUsdcBalance,
    refetchWalletAllocation,
    refetchWalletContributed,
  ]);

  const hasLiveRaisedData = Boolean(stats) || onChainRaised !== undefined;
  const onChainUsd =
    onChainRaised !== undefined ? Number(formatUnits(onChainRaised as bigint, 6)) : 0;
  const raised = hasLiveRaisedData
    ? Math.max(stats?.total_raised_usd ?? 0, onChainUsd)
    : 0;
  const cap = hardCapRaw
    ? Number(formatUnits(hardCapRaw as bigint, 6))
    : (stats?.hard_cap_usd ?? CONFIGURED_CAP);
  const pct = cap > 0 ? Math.min(100, (raised / cap) * 100) : 0;
  const price = pricePerToken ? Number(formatUnits(pricePerToken as bigint, 6)) : CONFIGURED_PRICE;
  const phase =
    phaseIndex !== undefined
      ? phaseFromIndex(Number(phaseIndex))
      : (stats?.current_phase ?? 'private');
  const isEligible = eligibility?.kyc_status === 'approved';
  const perWalletCap = (perWalletCapRaw as bigint | undefined) ?? 0n;
  const walletContributed = (walletContributedRaw as bigint | undefined) ?? 0n;
  const walletAllocation = (walletAllocationRaw as bigint | undefined) ?? 0n;
  const usdcBalance = (usdcBalanceRaw as bigint | undefined) ?? 0n;
  const usdcAllowance = (usdcAllowanceRaw as bigint | undefined) ?? 0n;
  const remainingWalletCap = perWalletCap > walletContributed ? perWalletCap - walletContributed : 0n;
  const maxContribution =
    remainingWalletCap > 0n && usdcBalance > remainingWalletCap ? remainingWalletCap : usdcBalance;
  const minContributionRaw = BigInt(MIN_CONTRIBUTION) * 10n ** BigInt(USDC_DECIMALS);
  const validAmount = Boolean(
    usdcAmount &&
      usdcAmount >= minContributionRaw &&
      usdcAmount <= usdcBalance &&
      (perWalletCap === 0n || usdcAmount <= remainingWalletCap),
  );
  const saleOpen = saleLive && phase !== 'closed' && raised < cap;
  const canContribute =
    saleLive &&
    saleOpen &&
    isEligible &&
    !wrongNetwork &&
    !geoBlocked &&
    validAmount &&
    paymentMethod === 'usdc';

  function handleContribution() {
    if (!isConnected || !address) {
      setMessage('Sign in with Privy to link your allocation wallet.');
      return;
    }
    if (!saleLive) {
      setMessage('The raise is not live yet. Your wallet is linked and ready for launch.');
      return;
    }
    if (!isEligible) {
      setMessage('Complete the whitelist and identity check before contributing.');
      return;
    }
    if (!saleAddress || !usdcAddress || !saleConfigured) {
      setMessage('On-chain sale contracts are not configured for this environment.');
      return;
    }
    if (geoLoading) {
      setMessage('Checking regional availability. Please wait.');
      return;
    }
    if (geoBlocked) {
      setMessage(`Sale participation is unavailable from ${country ?? 'your region'}.`);
      return;
    }
    if (wrongNetwork) {
      switchChain({ chainId: requiredChainId });
      return;
    }
    if (!saleOpen) {
      setMessage('This sale round is currently closed.');
      return;
    }
    if (!usdcAmount || usdcAmount < minContributionRaw) {
      setMessage(`Enter at least ${MIN_CONTRIBUTION} USDC with no more than 6 decimal places.`);
      return;
    }
    if (usdcAmount > usdcBalance) {
      setMessage('Your wallet does not have enough USDC for this contribution.');
      return;
    }
    if (perWalletCap > 0n && usdcAmount > remainingWalletCap) {
      setMessage(
        `Amount exceeds your remaining wallet cap of ${Number(formatUnits(remainingWalletCap, 6)).toLocaleString()} USDC.`,
      );
      return;
    }

    resetApproval();
    resetContribution();
    setPendingAmount(usdcAmount);

    if (usdcAllowance >= usdcAmount) {
      setMessage('Confirm the contribution in your wallet.');
      contribute(
        {
          address: saleAddress,
          abi: TOKEN_SALE_ABI,
          functionName: 'contributeUSDC',
          args: [usdcAmount, eligibility?.merkle_proof ?? []],
        },
        {
          onError: (error) => {
            setPendingAmount(null);
            setMessage(walletErrorMessage(error));
          },
        },
      );
      return;
    }

    setMessage('Approve the exact USDC amount. You will then confirm the contribution.');
    approveUsdc(
      {
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [saleAddress, usdcAmount],
      },
      {
        onError: (error) => {
          setPendingAmount(null);
          setMessage(walletErrorMessage(error));
        },
      },
    );
  }

  function setMaximumContribution() {
    if (maxContribution <= 0n) return;
    setAmount(formatUnits(maxContribution, USDC_DECIMALS));
  }

  const quests = [
    {
      title: 'Link your wallet',
      detail: privyConfigured
        ? 'Sign in with Privy email or wallet'
        : 'Connect a Base-compatible wallet',
      xp: '+100 XP',
      complete: isConnected,
      href: null,
    },
    {
      title: 'Join the whitelist',
      detail: 'Reserve your Phase 1 access',
      xp: '+250 XP',
      complete: Boolean(eligibility?.on_waitlist || isEligible),
      href: '/sale/contribute',
    },
    {
      title: 'Power the protocol',
      detail: saleLive ? 'Complete your first contribution' : 'Ready when the raise goes live',
      xp: '+1,000 XP',
      complete: (eligibility?.contributed_usd ?? 0) > 0,
      href: saleLive ? '/sale/contribute' : null,
    },
  ];

  const raiseStatusLabel = !saleLive
    ? 'NOT LIVE YET'
    : saleOpen
      ? 'RAISE LIVE'
      : 'ROUND CLOSED';

  const walletStatusLabel = !privyConfigured
    ? isConnected
      ? 'WALLET CONNECTED'
      : 'CONNECT WALLET'
    : !walletReady
      ? 'LOADING PRIVY…'
      : isLinking
        ? 'LINKING EMBEDDED WALLET…'
        : isConnected
          ? isEligible
            ? 'SIGNED IN + ELIGIBLE'
            : 'SIGNED IN — WALLET LINKED'
          : 'SIGN IN REQUIRED';

  return (
    <>
    <div className="relative min-h-screen overflow-hidden bg-[#f0edff] pt-24 text-[#131118]">
      <div className="raise-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-24 top-44 h-72 w-72 rounded-full bg-[#7047eb]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-12 h-80 w-80 bg-[#ffeb55]/40 blur-3xl" />

      <header className="relative z-10 border-y-[3px] border-black bg-[#131118] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3 font-display font-bold">
            <GamiTokenLogo className="h-11 w-11 rotate-3 border-2 border-white" />
            <span className="leading-[0.85] tracking-tight">
              GAMI
              <br />
              PROTOCOL
            </span>
          </div>
          <div className="flex items-center gap-5 font-mono text-xs sm:text-sm">
            <span
              className={`border px-3 py-2 font-bold ${
                saleLive && saleOpen
                  ? 'border-[#67f5a1] text-[#67f5a1]'
                  : 'border-[#ffeb55] text-[#ffeb55]'
              }`}
            >
              <span className={`mr-2 ${saleLive && saleOpen ? 'animate-pulse' : ''}`}>●</span>
              {raiseStatusLabel}
            </span>
            <span className="font-bold">
              ${raised.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
              {cap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
        <div className="h-2 bg-white/15">
          <div
            className="h-full bg-[#ffeb55] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <section>
            <div className="mb-7 inline-flex -rotate-1 items-center gap-3 border-2 border-black bg-[#ffeb55] px-4 py-2 font-mono text-xs font-bold uppercase shadow-[4px_4px_0_#131118]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7047eb]" />
              {saleLive
                ? `${phase} phase — ${saleOpen ? 'participation open' : 'currently closed'}`
                : 'Raise coming soon — link your Privy wallet now'}
            </div>
            <h1 className="max-w-3xl font-display text-[clamp(3.5rem,8vw,7.25rem)] font-bold uppercase leading-[0.82] tracking-[-0.075em]">
              Power the
              <br />
              universal
              <br />
              <span className="raise-highlight">rewards</span> economy
            </h1>
            <p className="mt-8 max-w-xl text-lg font-medium leading-relaxed text-[#4b4753]">
              {saleLive
                ? 'Join the $GAMI Token Raise. Early participants receive boosted XP multipliers, governance rights, and priority access to the protocol.'
                : 'The $GAMI raise is not live yet. Sign in with Privy to create or connect your allocation wallet, join the whitelist, and be ready when contributions open.'}
            </p>

            <div className="mt-9 grid max-w-xl grid-cols-3 border-[3px] border-black bg-white shadow-[7px_7px_0_#131118]">
              {[
                ['Price', `$${price.toFixed(3)}`],
                ['Min Allocation', `${MIN_CONTRIBUTION} USDC`],
                ['Distribution', '15% TGE + 1y'],
              ].map(([label, value], index) => (
                <div key={label} className={`p-4 ${index < 2 ? 'border-r-2 border-black' : ''}`}>
                  <p className="font-mono text-[10px] uppercase text-[#77727e]">{label}</p>
                  <p className="mt-2 font-display text-sm font-bold sm:text-base">{value}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                document.getElementById('contribute-card')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="mt-10 border-[3px] border-black bg-[#7047eb] px-8 py-4 font-display font-bold uppercase tracking-wide text-white shadow-[7px_7px_0_#131118] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_#131118]"
            >
              {saleLive ? 'Participate in raise →' : 'Link wallet for launch →'}
            </button>
            <Link
              to="/tokenomics"
              className="ml-0 mt-5 block w-fit border-b-2 border-black font-mono text-xs font-bold uppercase sm:ml-6 sm:inline-block"
            >
              Read the full GAMI Tokenomics + TGE plan →
            </Link>
          </section>

          <section id="contribute-card" className="relative scroll-mt-28">
            <div className="absolute -right-4 -top-5 z-20 rotate-3 border-2 border-black bg-[#ffeb55] px-3 py-2 font-mono text-[10px] font-bold uppercase shadow-[3px_3px_0_#131118]">
              {saleLive ? `${phase} round` : 'pre-launch'}
            </div>
            <div className="border-[3px] border-black bg-white p-5 shadow-[12px_12px_0_#131118] sm:p-8">
              <div className="flex items-center justify-between border-b-2 border-black pb-6">
                <div className="flex items-center gap-4">
                  <GamiTokenLogo className="h-14 w-14 border-2 border-black" />
                  <div>
                    <p className="font-display text-xl font-bold">$GAMI TOKEN</p>
                    <p className="font-mono text-xs uppercase text-[#77727e]">
                      {saleLive ? 'Presale round 1' : 'Wallet prep · not live'}
                    </p>
                  </div>
                </div>
                <ConnectWallet light />
              </div>

              <div className="my-7 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase text-[#77727e]">
                    Privy allocation account
                  </p>
                  <p className="mt-1 font-mono text-xs font-bold">{walletStatusLabel}</p>
                  {address && (
                    <p className="mt-1 font-mono text-[10px] text-[#77727e]">
                      {address.slice(0, 6)}…{address.slice(-4)}
                    </p>
                  )}
                </div>
                <span
                  className={`h-3 w-3 rounded-full border border-black ${
                    isConnected ? 'bg-[#67f5a1]' : isLinking || authenticated ? 'bg-[#ffeb55]' : 'bg-[#d5d0db]'
                  }`}
                />
              </div>

              {!privyConfigured && (
                <p className="mb-6 border-l-4 border-[#a13b3b] bg-[#fff4f4] p-3 font-mono text-xs text-[#a13b3b]">
                  Set `VITE_PRIVY_APP_ID` to enable Privy email + embedded wallet sign-in on this page.
                </p>
              )}

              {!saleLive && (
                <p className="mb-6 border-2 border-black bg-[#ffeb55] p-3 font-mono text-[11px] font-bold uppercase">
                  Raise is not live yet. Sign in now to reserve your allocation wallet.
                </p>
              )}

              <div className="mb-6">
                <p className="font-mono text-[11px] font-bold uppercase">Payment route</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(
                    [
                      ['usdc', 'USDC'],
                      ['usdt', 'USDT'],
                      ['fiat', 'Card / Fiat'],
                    ] as const
                  ).map(([method, label]) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`border-2 border-black px-2 py-3 font-mono text-[10px] font-bold uppercase ${
                        paymentMethod === method ? 'bg-[#ffeb55]' : 'bg-white hover:bg-[#f4f1f8]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {paymentMethod !== 'usdc' && (
                  <div className="mt-3 border-2 border-black bg-[#f4f1f8] p-4">
                    <p className="text-xs leading-relaxed">
                      {paymentMethod === 'usdt'
                        ? 'The sale contract settles in USDC. Swap USDT to USDC on Base, then return here to contribute.'
                        : 'Buy USDC on Base through the configured regulated on-ramp, then return here to contribute.'}
                    </p>
                    {(paymentMethod === 'usdt' ? usdtSwapUrl : fiatOnrampUrl) ? (
                      <a
                        href={(paymentMethod === 'usdt' ? usdtSwapUrl : fiatOnrampUrl) as string}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block w-full border-2 border-black bg-[#7047eb] px-4 py-3 text-center font-mono text-xs font-bold uppercase text-white"
                      >
                        {paymentMethod === 'usdt' ? 'Swap USDT to USDC ↗' : 'Buy USDC with fiat ↗'}
                      </a>
                    ) : (
                      <p className="mt-3 font-mono text-[10px] font-bold uppercase text-[#a13b3b]">
                        This payment route is not enabled yet. Do not send funds directly.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <label
                className="block font-mono text-[11px] font-bold uppercase"
                htmlFor="raise-amount"
              >
                Contribute (USDC)
              </label>
              <div className="mt-2 flex border-2 border-black bg-[#f4f1f8]">
                <input
                  id="raise-amount"
                  type="number"
                  min={MIN_CONTRIBUTION}
                  max={maxContribution > 0n ? formatUnits(maxContribution, USDC_DECIMALS) : undefined}
                  step="0.000001"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-4 py-4 font-mono text-2xl font-bold outline-none"
                />
                <span className="flex items-center border-l-2 border-black px-4 font-mono text-xs font-bold">
                  USDC
                </span>
              </div>
              {isConnected && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase text-[#77727e]">
                  <span>
                    Balance: {Number(formatUnits(usdcBalance, USDC_DECIMALS)).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{' '}
                    USDC
                  </span>
                  <button
                    type="button"
                    onClick={setMaximumContribution}
                    disabled={maxContribution <= 0n}
                    className="font-bold text-[#7047eb] underline disabled:text-[#77727e]"
                  >
                    Use max
                  </button>
                </div>
              )}

              <div className="my-4 flex justify-center font-mono text-xl">↓</div>

              <div className="flex items-center justify-between border-2 border-black bg-[#ebe4ff] px-4 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase text-[#77727e]">You receive</p>
                  <p className="mt-1 font-mono text-xl font-bold">
                    {tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <span className="font-display text-sm font-bold">$GAMI</span>
              </div>
              {isConnected && (
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase text-[#77727e]">
                  <span>
                    Already contributed:{' '}
                    {Number(formatUnits(walletContributed, USDC_DECIMALS)).toLocaleString()} USDC
                  </span>
                  <span className="text-right">
                    Reserved: {Number(formatUnits(walletAllocation, 18)).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    GAMI
                  </span>
                </div>
              )}

              {!isConnected ? (
                <div className="mt-5 border-2 border-dashed border-black/30 bg-[#f4f1f8] p-4 text-center">
                  <p className="mb-3 font-mono text-[10px] font-bold uppercase text-[#77727e]">
                    {isLinking
                      ? 'Privy signed in — creating your embedded allocation wallet…'
                      : 'Sign in with email or an existing wallet. Privy creates a secure embedded wallet when needed.'}
                  </p>
                  <ConnectWallet light className="w-full py-4 text-xs" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleContribution}
                  disabled={
                    !saleLive ||
                    isApproving ||
                    isContributing ||
                    isSwitchingChain ||
                    paymentMethod !== 'usdc' ||
                    (!canContribute && !wrongNetwork)
                  }
                  className="mt-5 w-full border-[3px] border-black bg-[#131118] py-4 font-display font-bold uppercase tracking-wide text-white shadow-[5px_5px_0_#7047eb] transition hover:bg-[#7047eb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {!saleLive
                    ? 'Wallet linked · waiting for launch'
                    : paymentMethod !== 'usdc'
                      ? 'Fund wallet above, then select USDC'
                      : isSwitchingChain
                        ? 'Switching network…'
                        : wrongNetwork
                          ? `Switch to ${requiredChainId === 8453 ? 'Base' : 'Base Sepolia'}`
                          : isApproving || isContributing
                            ? 'Confirm in wallet…'
                            : !saleConfigured
                              ? 'Sale contracts not configured'
                              : !saleOpen
                                ? 'Sale round closed'
                                : geoBlocked
                                  ? 'Unavailable in your region'
                                  : !validAmount
                                    ? 'Enter an eligible amount'
                                    : 'Confirm contribution'}
                </button>
              )}

              {geoBlocked && (
                <p className="mt-4 border-l-4 border-red-600 bg-red-50 p-3 font-mono text-xs text-red-800">
                  Participation is unavailable from {country ?? 'your region'} under the sale policy.
                </p>
              )}
              {isConnected && saleLive && !isEligible && (
                <Link
                  to="/sale/contribute"
                  className="mt-4 block text-center font-mono text-xs font-bold text-[#7047eb] underline"
                >
                  Complete whitelist + KYC first →
                </Link>
              )}
              {isConnected && !saleLive && (
                <Link
                  to="/sale/contribute"
                  className="mt-4 block text-center font-mono text-xs font-bold text-[#7047eb] underline"
                >
                  Join the whitelist while you wait →
                </Link>
              )}
              {message && (
                <p className="mt-4 border-l-4 border-[#7047eb] bg-[#f4f1f8] p-3 font-mono text-xs">
                  {message}
                </p>
              )}
              <p className="mt-5 text-center font-mono text-[9px] uppercase text-[#77727e]">
                Transactions settle on Base · Never share your seed phrase
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="border-[3px] border-black bg-[#ffeb55] p-6 shadow-[8px_8px_0_#131118]">
            <p className="font-mono text-xs font-bold uppercase">Participant benefits</p>
            <div className="mt-5 space-y-4">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 font-display font-bold">
                  <span className="flex h-7 w-7 items-center justify-center border-2 border-black bg-white text-sm">
                    ✓
                  </span>
                  {benefit}
                </div>
              ))}
            </div>
          </section>

          <section className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0_#7047eb]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase text-[#7047eb]">Raise quests</p>
                <h2 className="mt-1 font-display text-3xl font-bold uppercase">
                  Earn while you join
                </h2>
              </div>
              <span className="font-mono text-xs">
                {quests.filter((quest) => quest.complete).length}/{quests.length} COMPLETE
              </span>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {quests.map((quest) => {
                const body = (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold ${
                          quest.complete ? 'bg-[#67f5a1]' : 'bg-[#f0edff]'
                        }`}
                      >
                        {quest.complete ? '✓' : '○'}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#7047eb]">
                        {quest.xp}
                      </span>
                    </div>
                    <p className="mt-5 font-display text-sm font-bold uppercase">{quest.title}</p>
                    <p className="mt-1 text-xs text-[#77727e]">{quest.detail}</p>
                  </>
                );
                return quest.href && !quest.complete ? (
                  <Link
                    key={quest.title}
                    to={quest.href}
                    className="border-2 border-black p-4 transition hover:-translate-y-1 hover:bg-[#f0edff]"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={quest.title} className="border-2 border-black p-4">
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {showSuccess && contributionHash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg border-[3px] border-black bg-[#ffeb55] p-8 text-center shadow-[12px_12px_0_#7047eb]">
            <span className="text-6xl" role="img" aria-label="Celebration">
              🎉
            </span>
            <p className="mt-5 font-mono text-xs font-bold uppercase text-[#7047eb]">
              Contribution received
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase">Welcome to the raise</h2>
            <p className="mt-4 text-sm">
              Your $GAMI allocation has been reserved. The transaction is confirmed on Base.
            </p>
            <a
              href={getExplorerTxUrl(getChainId(), contributionHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 block font-mono text-xs font-bold underline"
            >
              View transaction ↗
            </a>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="mt-7 border-[3px] border-black bg-[#131118] px-8 py-4 font-display font-bold uppercase text-white"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
    <GamiFooter variant="ico" />
    </>
  );
}
