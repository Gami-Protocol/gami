'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { joinWaitlist } from '@/lib/sale';
import {
  fetchWaitlistPublicCount,
  REFERRAL_REWARD_TIERS,
  referralLinkFor,
} from '@/lib/waitlist';

const ROLES = [
  'Community',
  'Developer',
  'Founder',
  'Investor',
  'Creator',
  'Partner',
  'Other',
] as const;

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-2 animate-[confetti_1.2s_ease-out_forwards] rounded-sm"
          style={{
            left: `${(i * 17) % 100}%`,
            background: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#22d3ee' : '#fff',
            animationDelay: `${(i % 8) * 40}ms`,
            transform: `rotate(${i * 24}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) rotate(240deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [searchParams] = useSearchParams();
  const referredBy = useMemo(
    () => searchParams.get('ref')?.trim().toUpperCase() || undefined,
    [searchParams],
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<string>('Community');
  const [walletManual, setWalletManual] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [already, setAlready] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

  const siteKey =
    (typeof import.meta.env.VITE_TURNSTILE_SITE_KEY === 'string' &&
      import.meta.env.VITE_TURNSTILE_SITE_KEY) ||
    '';

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const wallet = isConnected && address ? address : walletManual;
  const displayWallet =
    isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : walletManual;

  useEffect(() => {
    void fetchWaitlistPublicCount().then((n) => {
      if (n != null) setCount(n);
    });
  }, [success]);

  useEffect(() => {
    if (!siteKey) return;
    const existing = document.querySelector('script[data-gami-turnstile]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.dataset.gamiTurnstile = '1';
    script.onload = () => {
      const w = window as Window & {
        turnstile?: {
          render: (
            el: string | HTMLElement,
            opts: { sitekey: string; callback: (token: string) => void },
          ) => void;
        };
      };
      const el = document.getElementById('gami-turnstile');
      if (el && w.turnstile) {
        w.turnstile.render(el, {
          sitekey: siteKey,
          callback: (token) => setTurnstileToken(token),
        });
      }
    };
    document.body.appendChild(script);
  }, [siteKey]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await joinWaitlist({
      name,
      email,
      company,
      role,
      wallet_address: wallet || undefined,
      referred_by: referredBy,
      source: 'website',
      turnstileToken,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? 'Failed to join waitlist. Please try again.');
      return;
    }

    if (result.alreadyOnWaitlist) {
      setAlready(true);
      setSuccess(true);
      setError('');
      return;
    }

    setReferralCode(result.referralCode ?? null);
    setAlready(false);
    setSuccess(true);
  }

  async function copyLink() {
    if (!referralCode) return;
    const link = referralLinkFor(referralCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link');
    }
  }

  if (success) {
    const link = referralCode ? referralLinkFor(referralCode) : null;
    return (
      <div className="relative py-8 text-center">
        <ConfettiBurst active={!already} />
        <div className="gami-gradient neo-border mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {already ? (
          <>
            <h3 className="mb-3 font-display text-2xl font-bold uppercase">Already on the list</h3>
            <p className="mb-6 text-gray-400">You&apos;re already on the waitlist.</p>
          </>
        ) : (
          <>
            <h3 className="mb-3 font-display text-3xl font-bold uppercase">Welcome to Gami Protocol</h3>
            <p className="mb-2 text-gray-300">You&apos;re officially on the waitlist.</p>
            <p className="mb-8 text-sm text-gray-500">We&apos;ll notify you before public launch.</p>
          </>
        )}

        {referralCode && link ? (
          <div className="mb-8 border-2 border-white/10 bg-black/40 p-5 text-left neo-border">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Invite friends
            </p>
            <p className="mb-1 font-display text-xl font-bold text-gami-accent">{referralCode}</p>
            <p className="mb-4 break-all font-mono text-xs text-gray-400">{link}</p>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="w-full border-2 border-white py-3 font-display text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black"
            >
              {copied ? 'Copied' : 'Copy invite link'}
            </button>
            <ul className="mt-4 space-y-1 font-mono text-[10px] text-gray-500">
              {REFERRAL_REWARD_TIERS.map((t) => (
                <li key={t.min}>
                  {t.min}+ referrals → {t.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Link
            to="/sale"
            className="gami-gradient block w-full py-4 text-center font-display font-bold uppercase tracking-widest neo-border shadow-brutal"
          >
            Sale dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setAlready(false);
              setReferralCode(null);
              setError('');
            }}
            className="w-full border-2 border-white/40 py-3 font-display text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-5">
      {!compact ? (
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase italic">Join the waitlist</h2>
          <div className="bg-gami-purple px-3 py-1 font-mono text-[10px] font-bold uppercase">
            {count != null ? `${count.toLocaleString()} in` : 'LIVE'}
          </div>
        </div>
      ) : null}

      {referredBy ? (
        <p className="border border-gami-accent/30 bg-gami-accent/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-gami-accent">
          Referred by {referredBy}
        </p>
      ) : null}

      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input"
          autoComplete="name"
          placeholder="GAMI PILOT"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          autoComplete="email"
          placeholder="pilot@gamiprotocol.io"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Company
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="form-input"
          autoComplete="organization"
          placeholder="Optional"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Role
        </label>
        <select
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="form-input"
          disabled={submitting}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Wallet address
        </label>
        <div className="relative">
          <input
            type="text"
            value={displayWallet}
            onChange={(e) => {
              if (!isConnected) setWalletManual(e.target.value);
            }}
            readOnly={isConnected}
            placeholder="0x…"
            className="form-input pr-24"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => {
              if (isConnected) {
                disconnect();
                return;
              }
              const connector = connectors[0];
              if (connector) connect({ connector });
            }}
            className="absolute bottom-2 right-2 top-2 bg-white px-3 font-display text-[10px] font-bold uppercase text-black hover:bg-gami-accent hover:text-white"
            disabled={submitting || isPending}
          >
            {isConnected ? 'Linked' : isPending ? '…' : 'Connect'}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Referral code
        </label>
        <input
          type="text"
          value={referredBy ?? ''}
          readOnly
          placeholder="Auto-filled from ?ref="
          className="form-input opacity-80"
        />
      </div>

      {siteKey ? <div id="gami-turnstile" className="flex justify-center" /> : null}

      {error ? (
        <div className="border border-red-500/40 bg-red-500/10 px-3 py-3">
          <p className="font-mono text-xs text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            className="mt-2 font-mono text-[10px] uppercase tracking-widest text-red-200 underline"
          >
            Dismiss · retry
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting || (Boolean(siteKey) && !turnstileToken)}
        className="gami-gradient flex w-full items-center justify-center gap-3 py-5 font-display text-xl font-bold uppercase tracking-widest neo-border shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Saving…
          </>
        ) : (
          'Secure spot'
        )}
      </button>

      <p className="text-center font-mono text-[10px] leading-tight text-gray-500">
        Early joiners receive priority allocation + lifetime XP multipliers
      </p>
    </form>
  );
}
