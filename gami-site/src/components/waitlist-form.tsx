'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLES = [
  { id: 'developer', label: 'Developer' },
  { id: 'partner', label: 'Partner' },
  { id: 'investor', label: 'Investor' },
  { id: 'community', label: 'Community' },
] as const;

const HANDLE_RE = /^[a-z0-9_]{3,15}$/;

type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const HANDLE_HINT: Record<HandleState, (handle: string) => string> = {
  idle: () => 'Your wallet address, but readable. Buy $GAMI and it lands here.',
  checking: () => 'checking availability…',
  available: (h) => `✓ ${h}.gami is yours — it unlocks in the Gami Wallet with this same email.`,
  taken: (h) => `✗ ${h}.gami is taken — try another.`,
  invalid: () => '3–15 lowercase letters, numbers, or underscore.',
};

const INTERESTS = [
  'Wallet Beta',
  'Developer SDK',
  'Partner Program',
  'Future Token Updates',
  'Enterprise Demo',
];

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [company, setCompany] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]['id']>('community');
  const [interests, setInterests] = useState<string[]>(['Wallet Beta']);
  const [referralCode, setReferralCode] = useState('');
  const [gamiHandle, setGamiHandle] = useState('');
  const [handleState, setHandleState] = useState<HandleState>('idle');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  // Live `.gami` availability — debounced so typing does not spam the API.
  useEffect(() => {
    if (!gamiHandle) {
      setHandleState('idle');
      return;
    }
    if (!HANDLE_RE.test(gamiHandle)) {
      setHandleState('invalid');
      return;
    }

    setHandleState('checking');
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/v1/dns/availability?handle=${encodeURIComponent(gamiHandle)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { ok?: boolean; available?: boolean }) => {
          if (!data.ok) {
            setHandleState('idle');
            return;
          }
          setHandleState(data.available ? 'available' : 'taken');
        })
        .catch(() => {
          // Offline or not configured — do not block the signup.
          setHandleState('idle');
        });
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [gamiHandle]);

  function toggleInterest(item: string) {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (gamiHandle && (handleState === 'taken' || handleState === 'invalid')) {
      setStatus('error');
      setError('Pick an available .gami name, or clear the field to skip it.');
      return;
    }
    setStatus('loading');
    setError('');

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        country,
        company,
        walletAddress,
        role,
        interests,
        referralCode,
        gamiHandle,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      setStatus('error');
      setError(data.error || 'Could not join waitlist');
      return;
    }

    router.push(`/waitlist/success?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={onSubmit} className={cn('space-y-5', compact && 'space-y-4')}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="field"
            autoComplete="name"
            placeholder="Marcus Mattus"
          />
        </Field>
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Country">
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="field"
            autoComplete="country-name"
            placeholder="United States"
          />
        </Field>
        <Field label="Company">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="field"
            autoComplete="organization"
            placeholder="Optional"
          />
        </Field>
      </div>

      <Field label="Wallet address (optional)">
        <input
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="field font-mono text-sm"
          placeholder="0x…"
        />
      </Field>

      <Field label="Claim your Gami name (optional)">
        <div className="flex items-center gap-2">
          <input
            value={gamiHandle}
            onChange={(e) =>
              setGamiHandle(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, '')
                  .slice(0, 15),
              )
            }
            className="field font-mono text-sm"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="yourname"
          />
          <span className="shrink-0 font-mono text-sm text-zinc-500">.gami</span>
        </div>
        <p
          className={cn(
            'mt-2 text-xs',
            handleState === 'available' && 'text-emerald-400',
            (handleState === 'taken' || handleState === 'invalid') && 'text-red-300',
            (handleState === 'idle' || handleState === 'checking') && 'text-zinc-500',
          )}
        >
          {HANDLE_HINT[handleState](gamiHandle)}
        </p>
      </Field>

      <div>
        <p className="mb-2 text-xs tracking-[0.18em] text-zinc-500 uppercase">Role</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition',
                role === item.id
                  ? 'border-primary bg-primary/20 text-white'
                  : 'border-white/10 text-zinc-400 hover:border-white/25',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs tracking-[0.18em] text-zinc-500 uppercase">Interested in</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleInterest(item)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition',
                interests.includes(item)
                  ? 'border-accent/60 bg-accent/10 text-white'
                  : 'border-white/10 text-zinc-400 hover:border-white/25',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <Field label="Referral code">
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="field"
          placeholder="Optional"
        />
      </Field>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? 'Joining…' : 'Secure your spot'}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-[0.18em] text-zinc-500 uppercase">{label}</span>
      {children}
    </label>
  );
}
