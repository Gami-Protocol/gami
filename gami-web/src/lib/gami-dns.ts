/**
 * `.gami` name client for the sale site.
 *
 * A buyer reserves `<handle>.gami` at signup; it binds to their wallet, and the
 * Gami Wallet resolves the same name after they sign in with the same email.
 * That is what turns "buy the token" into "the token is already in my wallet"
 * without anyone copying a hex address.
 */

import { env } from '@/lib/env';

export const HANDLE_RE = /^[a-z0-9_]{3,15}$/;

export type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function normalizeHandle(raw: string | null | undefined): string {
  return (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.gami$/i, '')
    .replace(/^@/, '');
}

export function toGamiDnsName(handle: string): string {
  return `${normalizeHandle(handle)}.gami`;
}

function dnsBase(): string | null {
  const base = env.gamiApiBase();
  if (base) return base;
  // Same-origin fallback (gami-site and gami-web deployed together).
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/v1`;
  }
  return null;
}

/** Live availability check for the signup form. `null` = could not determine. */
export async function checkHandleAvailability(
  handle: string,
  signal?: AbortSignal,
): Promise<boolean | null> {
  const normalized = normalizeHandle(handle);
  if (!HANDLE_RE.test(normalized)) return false;

  const base = dnsBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/dns/availability?handle=${encodeURIComponent(normalized)}`, {
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; available?: boolean };
    if (!data.ok) return null;
    return Boolean(data.available);
  } catch {
    return null;
  }
}

export type GamiDnsResolution = {
  name: string;
  handle: string;
  address: string;
  solana_address?: string | null;
};

/** Resolve `foo.gami` to the address that should receive the tokens. */
export async function resolveGamiName(name: string): Promise<GamiDnsResolution | null> {
  const normalized = normalizeHandle(name);
  if (!normalized) return null;

  const base = dnsBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/dns/resolve?name=${encodeURIComponent(normalized)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean } & Partial<GamiDnsResolution>;
    if (!data.ok || !data.address || !data.name || !data.handle) return null;
    return {
      name: data.name,
      handle: data.handle,
      address: data.address,
      solana_address: data.solana_address ?? null,
    };
  } catch {
    return null;
  }
}

/** Reverse lookup: the `.gami` name a connected wallet already answers to. */
export async function reverseResolveGamiName(address: string): Promise<GamiDnsResolution | null> {
  const addr = (address ?? '').trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(addr)) return null;

  const base = dnsBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/dns/resolve?address=${encodeURIComponent(addr)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean } & Partial<GamiDnsResolution>;
    if (!data.ok || !data.address || !data.name || !data.handle) return null;
    return {
      name: data.name,
      handle: data.handle,
      address: data.address,
      solana_address: data.solana_address ?? null,
    };
  } catch {
    return null;
  }
}

/** Bind (or rebind) a name to a wallet address after a purchase. */
export async function claimGamiName(input: {
  handle: string;
  email?: string;
  address?: string;
  source?: string;
}): Promise<{ ok: boolean; name?: string; error?: string }> {
  const handle = normalizeHandle(input.handle);
  if (!HANDLE_RE.test(handle)) {
    return { ok: false, error: 'Handle must be 3-15 lowercase letters, numbers, or underscore' };
  }

  const base = dnsBase();
  if (!base) return { ok: false, error: 'Name service not configured' };

  try {
    const res = await fetch(`${base}/dns/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        email: input.email,
        address: input.address,
        source: input.source ?? 'sale',
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      name?: string;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? 'Could not claim that name' };
    }
    return { ok: true, name: data.name };
  } catch {
    return { ok: false, error: 'Network error claiming name' };
  }
}

/**
 * Deep link that opens the Gami Wallet straight at the receive screen for this
 * name, falling back to the install page when the app is not present.
 */
export function walletReceiveLink(handle: string): { app: string; web: string } {
  const name = toGamiDnsName(handle);
  const scheme = env.walletDeepLinkScheme();
  return {
    app: `${scheme}://receive?name=${encodeURIComponent(name)}`,
    web: `${env.walletUniversalLink()}?name=${encodeURIComponent(name)}`,
  };
}
