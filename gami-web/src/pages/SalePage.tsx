import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

import { ConnectWallet } from '@/components/ConnectWallet';
import { SaleRaiseHeader } from '@/components/sale/SaleRaiseHeader';
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
  previewGamiAllocation,
  type SaleEligibility,
  type SaleStats,
} from '@/lib/sale';

const FALLBACK_RAISED = 4_800_000;
const FALLBACK_CAP = 12_000_000;
const FALLBACK_PRICE = 0.045;
const MIN_CONTRIBUTION = 500;

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
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [eligibility, setEligibility] = useState<SaleEligibility | null>(null);
  const [amount, setAmount] = useState('500');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const saleAddress = getContractAddress('TOKEN_SALE');
  const usdcAddress = getContractAddress('USDC');
  const saleConfigured = isSaleConfigured();

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
    query: { enabled: Boolean(saleAddress) },
  });

  const { data: pricePerToken } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'pricePerToken',
    query: { enabled: Boolean(saleAddress) },
  });

  const { data: phaseIndex } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'currentPhase',
    query: { enabled: Boolean(saleAddress), refetchInterval: 15_000 },
  });

  const {
    writeContract: approveUsdc,
    data: approvalHash,
    isPending: isApproving,
  } = useWriteContract();
  const {
    writeContract: contribute,
    data: contributionHash,
    isPending: isContributing,
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
    void fetchSaleStats().then(setStats);
  }, []);

  useEffect(() => {
    void refreshEligibility();
  }, [refreshEligibility]);

  const usdcAmount = useMemo(() => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return 0n;
    return parseUnits(value.toFixed(6), 6);
  }, [amount]);

  const tokenAmount = useMemo(() => {
    if (pricePerToken && usdcAmount > 0n) {
      return Number(formatUnits(previewGamiAllocation(usdcAmount, pricePerToken as bigint), 18));
    }
    return Number(amount || 0) / FALLBACK_PRICE;
  }, [amount, pricePerToken, usdcAmount]);

  useEffect(() => {
    if (!approvalConfirmed || !saleAddress || !address || contributionHash || usdcAmount === 0n) {
      return;
    }

    setMessage('Approval confirmed. Confirm the contribution in your wallet.');
    contribute(
      {
        address: saleAddress,
        abi: TOKEN_SALE_ABI,
        functionName: 'contributeUSDC',
        args: [usdcAmount, eligibility?.merkle_proof ?? []],
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
    usdcAmount,
  ]);

  useEffect(() => {
    if (!contributionConfirmed) return;
    setShowSuccess(true);
    setMessage('');
    void refreshEligibility();
    void fetchSaleStats().then(setStats);
  }, [contributionConfirmed, refreshEligibility]);

  const hasLiveRaisedData = Boolean(stats || onChainRaised);
  const onChainUsd =
    onChainRaised !== undefined ? Number(formatUnits(onChainRaised as bigint, 6)) : 0;
  const raised = hasLiveRaisedData
    ? Math.max(stats?.total_raised_usd ?? 0, onChainUsd)
    : FALLBACK_RAISED;
  const cap = hardCapRaw
    ? Number(formatUnits(hardCapRaw as bigint, 6))
    : (stats?.hard_cap_usd ?? FALLBACK_CAP);
  const price = pricePerToken ? Number(formatUnits(pricePerToken as bigint, 6)) : FALLBACK_PRICE;
  const phase =
    phaseIndex !== undefined
      ? phaseFromIndex(Number(phaseIndex))
      : (stats?.current_phase ?? 'private');
  const isEligible = eligibility?.kyc_status === 'approved';
  const validAmount = Number(amount) >= MIN_CONTRIBUTION;

  function handleContribution() {
    if (!isConnected || !address) {
      setMessage('Connect your wallet to continue.');
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
    if (!validAmount) {
      setMessage(`The minimum contribution is ${MIN_CONTRIBUTION} USDC.`);
      return;
    }

    setMessage('Approve USDC in your wallet. You will then confirm the contribution.');
    approveUsdc(
      {
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [saleAddress, usdcAmount],
      },
      {
        onError: (error) => setMessage(walletErrorMessage(error)),
      },
    );
  }

  const quests = [
    {
      title: 'Link your wallet',
      detail: 'Connect a Base-compatible wallet',
      xp: '+100 XP',
      complete: isConnected,
      href: null as string | null,
      action: 'connect' as const,
    },
    {
      title: 'Join the whitelist',
      detail: 'Reserve your Phase 1 access',
      xp: '+250 XP',
      complete: Boolean(eligibility?.on_waitlist || isEligible),
      href: '/sale/contribute',
      action: null,
    },
    {
      title: 'Power the protocol',
      detail: 'Complete your first contribution',
      xp: '+1,000 XP',
      complete: (eligibility?.contributed_usd ?? 0) > 0,
      href: '/sale/contribute',
      action: null,
    },
  ];

  function handleWalletQuest() {
    const connector = connectors.find((c) => c.ready) ?? connectors[0];
    if (connector) connect({ connector });
  }

  return (
    <div className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f0edff] text-[#131118]">
      <div className="raise-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-24 top-44 hidden h-72 w-72 rounded-full bg-[#7047eb]/20 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -right-16 top-12 hidden h-80 w-80 bg-[#ffeb55]/40 blur-3xl sm:block" />

      <SaleRaiseHeader raised={raised} cap={cap} showProgress />

      <main className="sale-safe-bottom relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-14">
          <section className="order-2 min-w-0 lg:order-1">
            <div className="mb-4 inline-flex -rotate-1 items-center gap-2 border-2 border-black bg-[#ffeb55] px-3 py-1.5 font-mono text-[10px] font-bold uppercase shadow-[4px_4px_0_#131118] sm:mb-7 sm:gap-3 sm:px-4 sm:py-2 sm:text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7047eb]" />
              Phase 1 — Whitelist Open
            </div>
            <h1 className="max-w-3xl font-display text-[clamp(2rem,10vw,7.25rem)] font-bold uppercase leading-[0.88] tracking-[-0.04em] sm:leading-[0.82] sm:tracking-[-0.075em]">
              Power the
              <br />
              universal
              <br />
              <span className="raise-highlight">rewards</span> economy
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-[#4b4753] sm:mt-8 sm:text-lg">
              Join the $GAMI Token Raise. Early participants receive boosted XP multipliers,
              governance rights, and priority access to the protocol.
            </p>

            <div className="mt-6 grid w-full max-w-xl grid-cols-1 divide-y-2 divide-black border-[3px] border-black bg-white shadow-[5px_5px_0_#131118] sm:mt-9 sm:grid-cols-3 sm:divide-y-0 sm:shadow-[7px_7px_0_#131118]">
              {[
                ['Price', `$${price.toFixed(3)}`],
                ['Min Allocation', `${MIN_CONTRIBUTION} USDC`],
                ['Vesting', '30d cliff'],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`p-3 sm:p-4 ${index < 2 ? 'sm:border-r-2 sm:border-black' : ''}`}
                >
                  <p className="font-mono text-[10px] uppercase text-[#77727e]">{label}</p>
                  <p className="mt-1 font-display text-sm font-bold sm:mt-2 sm:text-base">{value}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                document.getElementById('contribute-card')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="mt-6 hidden w-full border-[3px] border-black bg-[#7047eb] px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-[5px_5px_0_#131118] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_#131118] sm:mt-10 sm:w-auto sm:px-8 sm:py-4 sm:text-base lg:inline-block"
            >
              Participate in raise →
            </button>
            <Link
              to="/tokenomics"
              className="mt-4 block w-fit border-b-2 border-black font-mono text-[10px] font-bold uppercase sm:mt-5 sm:text-xs"
            >
              Read the full GAMI Tokenomics + TGE plan →
            </Link>
          </section>

          <section id="contribute-card" className="relative order-1 min-w-0 scroll-mt-24 lg:order-2 lg:scroll-mt-28">
            <div className="absolute -right-2 -top-4 z-20 rotate-3 border-2 border-black bg-[#ffeb55] px-2 py-1 font-mono text-[9px] font-bold uppercase shadow-[3px_3px_0_#131118] sm:-right-4 sm:-top-5 sm:px-3 sm:py-2 sm:text-[10px]">
              {phase} round
            </div>
            <div className="border-[3px] border-black bg-white p-4 shadow-[8px_8px_0_#131118] sm:p-6 lg:p-8 lg:shadow-[12px_12px_0_#131118]">
              <div className="flex flex-col gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-[#7047eb] font-display text-2xl font-bold text-white sm:h-14 sm:w-14 sm:text-3xl">
                    G
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold sm:text-xl">$GAMI TOKEN</p>
                    <p className="font-mono text-[10px] uppercase text-[#77727e] sm:text-xs">Presale round 1</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <ConnectWallet variant="sale" />
                </div>
              </div>

              <div className="my-5 flex items-center justify-between sm:my-7">
                <div>
                  <p className="font-mono text-[10px] uppercase text-[#77727e]">Wallet status</p>
                  <p className="mt-1 font-mono text-xs font-bold">
                    {isConnected
                      ? isEligible
                        ? 'VERIFIED + ELIGIBLE'
                        : 'CONNECTED'
                      : 'NOT CONNECTED'}
                  </p>
                </div>
                <span
                  className={`h-3 w-3 rounded-full border border-black ${
                    isConnected ? 'bg-[#67f5a1]' : 'bg-[#d5d0db]'
                  }`}
                />
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
                  step="100"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-xl font-bold outline-none sm:px-4 sm:py-4 sm:text-2xl"
                />
                <span className="flex items-center border-l-2 border-black px-4 font-mono text-xs font-bold">
                  USDC
                </span>
              </div>

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

              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleWalletQuest}
                  disabled={isConnecting}
                  className="mt-5 w-full border-[3px] border-black bg-[#7047eb] py-4 font-display font-bold uppercase tracking-wide text-white shadow-[5px_5px_0_#131118] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#131118] disabled:opacity-60"
                >
                  {isConnecting ? 'Connecting…' : 'Connect Wallet to Contribute'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleContribution}
                  disabled={isApproving || isContributing}
                  className="mt-5 w-full border-[3px] border-black bg-[#131118] py-4 font-display font-bold uppercase tracking-wide text-white shadow-[5px_5px_0_#7047eb] transition hover:bg-[#7047eb] disabled:cursor-wait disabled:opacity-60"
                >
                  {isApproving || isContributing ? 'Confirm in wallet…' : 'Confirm contribution'}
                </button>
              )}

              {isConnected && !isEligible && (
                <Link
                  to="/sale/contribute"
                  className="mt-4 block text-center font-mono text-xs font-bold text-[#7047eb] underline"
                >
                  Complete whitelist + KYC first →
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

        <div className="mt-10 grid w-full gap-6 sm:mt-16 sm:gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="min-w-0 border-[3px] border-black bg-[#ffeb55] p-4 shadow-[6px_6px_0_#131118] sm:p-6 sm:shadow-[8px_8px_0_#131118]">
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

          <section className="min-w-0 border-[3px] border-black bg-white p-4 shadow-[6px_6px_0_#7047eb] sm:p-6 sm:shadow-[8px_8px_0_#7047eb]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase text-[#7047eb]">Raise quests</p>
                <h2 className="mt-1 font-display text-2xl font-bold uppercase sm:text-3xl">
                  Earn while you join
                </h2>
              </div>
              <span className="font-mono text-[10px] sm:text-xs">
                {quests.filter((quest) => quest.complete).length}/{quests.length} COMPLETE
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:mt-6 md:grid-cols-3">
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
                      <span className="font-mono text-[10px] font-bold text-[#7047eb]">{quest.xp}</span>
                    </div>
                    <p className="mt-5 font-display text-sm font-bold uppercase">{quest.title}</p>
                    <p className="mt-1 text-xs text-[#77727e]">{quest.detail}</p>
                  </>
                );

                if (quest.action === 'connect' && !quest.complete) {
                  return (
                    <button
                      key={quest.title}
                      type="button"
                      onClick={handleWalletQuest}
                      disabled={isConnecting}
                      className="border-2 border-black p-4 text-left transition hover:-translate-y-1 hover:bg-[#f0edff] disabled:opacity-60"
                    >
                      {body}
                    </button>
                  );
                }

                if (quest.href && !quest.complete) {
                  return (
                    <Link
                      key={quest.title}
                      to={quest.href}
                      className="border-2 border-black p-4 transition hover:-translate-y-1 hover:bg-[#f0edff]"
                    >
                      {body}
                    </Link>
                  );
                }

                return (
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
  );
}
