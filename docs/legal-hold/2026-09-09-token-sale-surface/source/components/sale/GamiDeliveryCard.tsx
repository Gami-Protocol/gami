import { useEffect, useState } from 'react';

import {
  claimGamiName,
  HANDLE_RE,
  reverseResolveGamiName,
  walletReceiveLink,
} from '@/lib/gami-dns';

type GamiDeliveryCardProps = {
  /** Connected EVM wallet that will receive the raise allocation. */
  address?: `0x${string}`;
  /** Known signup email, so a claim here links the same backend identity. */
  email?: string;
  /** Light (SalePage) vs dark (ContributePage) surface. */
  variant?: 'light' | 'dark';
};

/**
 * Turns "I bought GAMI" into "GAMI is in my wallet".
 *
 * Shows the `.gami` name this wallet already answers to, or lets the buyer
 * claim one right here. Either way it hands them a deep link that opens the
 * Gami Wallet on the receive screen for that name — so nobody has to copy a
 * hex address between a browser and a phone.
 */
export function GamiDeliveryCard({ address, email, variant = 'light' }: GamiDeliveryCardProps) {
  const light = variant === 'light';
  const [name, setName] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }
    setLoading(true);
    let cancelled = false;
    void reverseResolveGamiName(address)
      .then((found) => {
        if (cancelled) return;
        setName(found?.name ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!address) return null;

  const panelClass = light
    ? 'mt-3 border-2 border-black bg-[#fffbe8] p-4'
    : 'mt-3 border border-white/15 bg-white/5 p-4';
  const labelClass = light
    ? 'font-mono text-[11px] font-bold uppercase'
    : 'font-mono text-[11px] font-bold uppercase text-muted';
  const textMuted = light ? 'text-xs leading-relaxed' : 'text-xs leading-relaxed text-muted';
  const btnPrimary = light
    ? 'border-2 border-black bg-[#7047eb] px-4 py-3 font-mono text-xs font-bold uppercase text-white disabled:opacity-50'
    : 'border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase text-white disabled:opacity-50';
  const inputClass = light
    ? 'w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs'
    : 'w-full border border-white/20 bg-surface px-3 py-2 font-mono text-xs text-white';

  async function onClaim() {
    const normalized = handle.trim().toLowerCase();
    if (!HANDLE_RE.test(normalized)) {
      setError('3–15 lowercase letters, numbers, or underscore.');
      return;
    }
    setError('');
    setClaiming(true);
    const result = await claimGamiName({
      handle: normalized,
      email,
      address,
      source: 'sale',
    });
    setClaiming(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not claim that name');
      return;
    }
    setName(result.name ?? `${normalized}.gami`);
  }

  return (
    <div className={panelClass}>
      <p className={labelClass}>Get GAMI into your wallet</p>

      {loading ? (
        <p className={`mt-2 ${textMuted}`}>Checking your Gami name…</p>
      ) : name ? (
        <>
          <p className="mt-2 font-display text-xl font-bold text-[#7047eb]">{name}</p>
          <p className={`mt-2 ${textMuted}`}>
            Your allocation is delivered to {name}. Open the Gami Wallet and sign in with the same
            email you used at signup — no address to copy.
          </p>
          <a href={walletReceiveLink(name).app} className={`mt-3 block text-center ${btnPrimary}`}>
            Open in Gami Wallet
          </a>
          <a
            href={walletReceiveLink(name).web}
            className={`mt-2 block text-center font-mono text-[10px] uppercase ${
              light ? 'text-[#77727e]' : 'text-muted'
            }`}
          >
            Don&apos;t have the app? Get it here
          </a>
        </>
      ) : (
        <>
          <p className={`mt-2 ${textMuted}`}>
            Claim a readable name for this wallet. It works as your receive address and follows you
            into the Gami Wallet.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={handle}
              onChange={(e) =>
                setHandle(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, '')
                    .slice(0, 15),
                )
              }
              className={inputClass}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourname"
              disabled={claiming}
            />
            <span
              className={`shrink-0 font-mono text-xs ${light ? 'text-[#77727e]' : 'text-muted'}`}
            >
              .gami
            </span>
          </div>
          <button
            type="button"
            onClick={() => void onClaim()}
            disabled={claiming || !handle}
            className={`mt-3 w-full ${btnPrimary}`}
          >
            {claiming ? 'Claiming…' : 'Claim name'}
          </button>
        </>
      )}

      {error ? <p className="mt-2 font-mono text-[10px] text-red-500">{error}</p> : null}
    </div>
  );
}
