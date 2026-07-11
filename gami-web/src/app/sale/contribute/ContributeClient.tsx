'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { parseUnits } from 'viem';

import { GeoBlockBanner } from '@/hooks/useGeoBlock';
import {
  TOKEN_SALE_ABI,
  USDC_ABI,
  getContractAddress,
  getExplorerTxUrl,
  getChainId,
} from '@/lib/contracts';
import {
  fetchEligibility,
  isSaleConfigured,
  joinWaitlist,
  previewGamiAllocation,
  requestKycApproval,
} from '@/lib/sale';

type Step = 'waitlist' | 'kyc' | 'eligibility' | 'contribute' | 'confirm';

const STEPS: Step[] = ['waitlist', 'kyc', 'eligibility', 'contribute', 'confirm'];

export default function ContributeClient() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') ?? undefined;
  const walletParam = searchParams.get('wallet') ?? undefined;

  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<Step>('waitlist');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('100');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [eligibility, setEligibility] = useState<Awaited<ReturnType<typeof fetchEligibility>>>(null);

  const saleAddress = getContractAddress('TOKEN_SALE');
  const usdcAddress = getContractAddress('USDC');
  const saleConfigured = isSaleConfigured();

  const { data: pricePerToken } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'pricePerToken',
    query: { enabled: Boolean(saleAddress) },
  });

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeContribute, data: contributeHash } = useWriteContract();

  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: contributeConfirmed } = useWaitForTransactionReceipt({ hash: contributeHash });

  const usdcAmount = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0n;
    return parseUnits(n.toFixed(6), 6);
  }, [amount]);

  const gamiPreview = useMemo(() => {
    if (!pricePerToken || usdcAmount === 0n) return 0n;
    return previewGamiAllocation(usdcAmount, pricePerToken as bigint);
  }, [pricePerToken, usdcAmount]);

  const refreshEligibility = useCallback(async () => {
    if (!address) return;
    const data = await fetchEligibility(address);
    setEligibility(data);
    return data;
  }, [address]);

  useEffect(() => {
    if (walletParam && walletParam.startsWith('0x')) {
      setStep('kyc');
    }
  }, [walletParam]);

  useEffect(() => {
    if (contributeConfirmed && contributeHash) {
      setTxHash(contributeHash);
      setStep('confirm');
      setStatus('done');
      void refreshEligibility();
    }
  }, [contributeConfirmed, contributeHash, refreshEligibility]);

  useEffect(() => {
    if (!approveConfirmed || !approveHash || !saleAddress || !address || contributeHash) return;

    const proof = (eligibility?.merkle_proof ?? []) as `0x${string}`[];
    writeContribute({
      address: saleAddress,
      abi: TOKEN_SALE_ABI,
      functionName: 'contributeUSDC',
      args: [usdcAmount, proof],
    });
    setMessage('Confirm contribution in your wallet…');
  }, [
    approveConfirmed,
    approveHash,
    contributeHash,
    saleAddress,
    address,
    eligibility,
    usdcAmount,
    writeContribute,
  ]);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const result = await joinWaitlist({
      email,
      wallet_address: address ?? walletParam,
      referral_code: referralCode,
    });
    if (!result.ok) {
      setStatus('error');
      setMessage(result.error ?? 'Failed');
      return;
    }
    setStatus('done');
    setMessage('You are on the waitlist! Continue to KYC.');
    setStep('kyc');
  }

  async function handleKyc() {
    if (!isConnected || !address) {
      setMessage('Connect your wallet first.');
      return;
    }
    setStatus('loading');

    const templateId = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID;
    if (templateId) {
      setMessage('Complete verification in the Persona modal (configure SDK with your template).');
      setStatus('idle');
      return;
    }

    const result = await requestKycApproval({ wallet_address: address, email });
    if (!result.ok) {
      setStatus('error');
      setMessage(result.error ?? 'KYC failed');
      return;
    }
    setStatus('done');
    setMessage('Identity verified (sandbox). Checking eligibility…');
    await refreshEligibility();
    setStep('eligibility');
  }

  async function handleCheckEligibility() {
    setStatus('loading');
    const data = await refreshEligibility();
    setStatus('idle');
    if (!data) {
      setMessage('Could not load eligibility. Is the backend configured?');
      return;
    }
    if (data.kyc_status !== 'approved') {
      setMessage('KYC not approved yet.');
      return;
    }
    setMessage('You are eligible to contribute.');
    setStep('contribute');
  }

  async function handleContribute() {
    if (!saleAddress || !usdcAddress || !address) return;
    setStatus('loading');
    setMessage('');

    try {
      writeApprove({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [saleAddress, usdcAmount],
      });
      setMessage('Approve USDC in your wallet…');
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Approve failed');
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Contribute</h1>
      <p className="mt-2 text-muted">Join the waitlist, verify identity, and contribute USDC on Base.</p>

      <GeoBlockBanner />

      <div className="mt-6 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 ${i <= stepIndex ? 'bg-primary' : 'bg-white/10'}`}
          />
        ))}
      </div>

      {referralCode && (
        <p className="mt-4 font-mono text-xs text-secondary">Referral: {referralCode}</p>
      )}

      {step === 'waitlist' && (
        <form onSubmit={handleWaitlist} className="mt-8 space-y-4">
          <div>
            <label className="font-mono text-xs text-muted">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-muted">AMOUNT USD (intent)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none"
              min="10"
              max="2500"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="sticker-shadow w-full bg-primary py-4 font-display font-bold uppercase disabled:opacity-50"
          >
            {status === 'loading' ? 'Submitting…' : '1. Join Waitlist'}
          </button>
        </form>
      )}

      {step === 'kyc' && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted">
            Connect your wallet and complete KYC. Sandbox mode auto-approves when Persona is not configured.
          </p>
          <button
            type="button"
            onClick={handleKyc}
            disabled={status === 'loading' || !isConnected}
            className="sticker-shadow w-full bg-primary py-4 font-display font-bold uppercase disabled:opacity-50"
          >
            2. Complete KYC
          </button>
        </div>
      )}

      {step === 'eligibility' && (
        <div className="mt-8 space-y-4">
          <div className="border border-white/10 p-4 font-mono text-sm">
            <p>KYC: {eligibility?.kyc_status ?? 'unknown'}</p>
            <p>Contributed: ${eligibility?.contributed_usd ?? 0}</p>
          </div>
          <button
            type="button"
            onClick={handleCheckEligibility}
            className="sticker-shadow w-full bg-primary py-4 font-display font-bold uppercase"
          >
            3. Confirm Eligibility
          </button>
        </div>
      )}

      {step === 'contribute' && (
        <div className="mt-8 space-y-4">
          {!saleConfigured && (
            <p className="text-sm text-yellow-400">
              Set NEXT_PUBLIC_TOKEN_SALE_ADDRESS and NEXT_PUBLIC_USDC_ADDRESS to enable on-chain contributions.
            </p>
          )}
          <div>
            <label className="font-mono text-xs text-muted">USDC AMOUNT</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none"
              min="10"
              max="2500"
            />
          </div>
          <p className="font-mono text-sm text-primary">
            ≈ {(Number(gamiPreview) / 1e18).toLocaleString()} GAMI
          </p>
          <button
            type="button"
            onClick={handleContribute}
            disabled={status === 'loading' || !saleConfigured || usdcAmount === 0n}
            className="sticker-shadow w-full bg-primary py-4 font-display font-bold uppercase disabled:opacity-50"
          >
            4. Approve & Contribute USDC
          </button>
        </div>
      )}

      {step === 'confirm' && txHash && (
        <div className="mt-8 space-y-4">
          <div className="sticker-shadow border-2 border-green-500/30 bg-surface p-6 text-center">
            <p className="font-mono text-xs text-muted">CONTRIBUTION CONFIRMED</p>
            <a
              href={getExplorerTxUrl(getChainId(), txHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block font-mono text-sm text-primary underline"
            >
              View transaction
            </a>
          </div>
          <Link href="/wallet" className="block text-center font-mono text-sm text-primary hover:underline">
            → Download Gami Wallet for +50 XP
          </Link>
          <a href="gami://onboarding/welcome" className="block text-center font-mono text-xs text-muted">
            Open in Gami Wallet app
          </a>
        </div>
      )}

      {message && (
        <p className={`mt-4 font-mono text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}

      <Link href="/sale" className="mt-8 inline-block font-mono text-sm text-muted hover:text-white">
        ← Back to sale dashboard
      </Link>
    </div>
  );
}
