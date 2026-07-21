import { env } from '@/lib/env';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;
const RATE_LIMIT_MS = 8_000;
const RATE_LIMIT_KEY = 'gami_waitlist_last_submit';

export const REFERRAL_REWARD_TIERS = [
  { min: 5, label: 'Early Access' },
  { min: 25, label: 'Genesis Badge' },
  { min: 100, label: 'Founder Role' },
  { min: 500, label: 'Exclusive NFT' },
] as const;

export type WaitlistJoinInput = {
  name: string;
  email: string;
  company?: string;
  wallet?: string;
  role?: string;
  referralCode?: string;
  referredBy?: string;
  source?: string;
  country?: string;
  turnstileToken?: string;
};

export type WaitlistJoinResult = {
  ok: boolean;
  error?: string;
  alreadyOnWaitlist?: boolean;
  id?: string;
  status?: string;
  referralCode?: string;
  referralLink?: string;
};

function sanitize(value: string | undefined | null, max = 200): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[<>]/g, '').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

function siteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://gamiprotocol.io';
}

export function referralLinkFor(code: string): string {
  return `${siteOrigin()}/?ref=${encodeURIComponent(code)}`;
}

export function rewardTierForCount(count: number): string {
  let label = 'Member';
  for (const tier of REFERRAL_REWARD_TIERS) {
    if (count >= tier.min) label = tier.label;
  }
  return label;
}

/** Client-side invite code so INSERT-only RLS does not need a SELECT return. */
export function generateReferralCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = 'GAMI-';
  for (const b of bytes) {
    code += alphabet[b % alphabet.length]!;
  }
  return code;
}

function checkClientRateLimit(): string | null {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const last = raw ? Number(raw) : 0;
    if (last && Date.now() - last < RATE_LIMIT_MS) {
      return 'Please wait a few seconds before trying again.';
    }
  } catch {
    // sessionStorage unavailable
  }
  return null;
}

function markClientSubmit(): void {
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function validateWaitlistInput(input: WaitlistJoinInput): string | null {
  const name = sanitize(input.name, 120);
  const email = sanitize(input.email, 254)?.toLowerCase();
  const wallet = sanitize(input.wallet, 42)?.toLowerCase();

  if (!name) return 'Name is required';
  if (!email || !EMAIL_RE.test(email)) return 'Valid email is required';
  if (wallet && !WALLET_RE.test(wallet)) return 'Wallet must be a valid 0x EVM address';
  if (!sanitize(input.role, 64)) return 'Role is required';
  return null;
}

/** Track waitlist_joined for PostHog / GA when available. */
export function trackWaitlistJoined(props: {
  email: string;
  source: string;
  referral?: string | null;
  wallet_connected: boolean;
  country?: string | null;
}): void {
  const payload = {
    ...props,
    timestamp: new Date().toISOString(),
  };

  try {
    const w = window as Window & {
      posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void };
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    w.posthog?.capture('waitlist_joined', payload);
    w.gtag?.('event', 'waitlist_joined', payload);
    w.dataLayer?.push({ event: 'waitlist_joined', ...payload });
  } catch {
    // Analytics must never block signup.
  }
}

async function triggerWelcomeEmail(input: {
  email: string;
  name: string;
  referralCode: string;
  referralLink: string;
}): Promise<void> {
  const base = env.supabaseUrl()?.replace(/\/$/, '');
  const key = env.supabaseAnonKey();
  if (!base || !key) return;

  await fetch(`${base}/functions/v1/waitlist-welcome`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}

/**
 * Primary waitlist signup via Supabase (anon insert + RLS).
 * Handles duplicates gracefully and returns a personal referral code.
 */
export async function joinWaitlistSupabase(
  input: WaitlistJoinInput,
): Promise<WaitlistJoinResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        'Backend not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  const rateError = checkClientRateLimit();
  if (rateError) return { ok: false, error: rateError };

  const validationError = validateWaitlistInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = getSupabase()!;
  const name = sanitize(input.name, 120)!;
  const email = sanitize(input.email, 254)!.toLowerCase();
  const company = sanitize(input.company, 120);
  const role = sanitize(input.role, 64);
  const wallet = sanitize(input.wallet, 42)?.toLowerCase() ?? null;
  const referredBy =
    sanitize(input.referredBy ?? input.referralCode, 32)?.toUpperCase() ?? null;
  const source = sanitize(input.source, 32) ?? 'website';
  const country = sanitize(input.country, 64);
  const referralCode = generateReferralCode();

  const row = {
    email,
    full_name: name,
    company,
    role,
    wallet_address: wallet,
    referral_code: referralCode,
    referred_by: referredBy,
    source,
    country,
    status: wallet ? 'wallet_linked' : 'pending',
  };

  const { error } = await supabase.from('waitlist').insert(row);

  if (error) {
    const msg = error.message || '';
    const duplicate =
      error.code === '23505' ||
      msg.includes('duplicate') ||
      msg.includes('unique') ||
      msg.toLowerCase().includes('already exists');

    if (duplicate) {
      // Collision on invite code is rare — retry once with a fresh code.
      if (msg.includes('referral_code') || msg.includes('idx_waitlist_referral')) {
        const retryCode = generateReferralCode();
        const retry = await supabase.from('waitlist').insert({ ...row, referral_code: retryCode });
        if (!retry.error) {
          markClientSubmit();
          const link = referralLinkFor(retryCode);
          trackWaitlistJoined({
            email,
            source,
            referral: referredBy,
            wallet_connected: Boolean(wallet),
            country,
          });
          void triggerWelcomeEmail({ email, name, referralCode: retryCode, referralLink: link });
          return {
            ok: true,
            status: row.status,
            referralCode: retryCode,
            referralLink: link,
          };
        }
      }

      return {
        ok: true,
        alreadyOnWaitlist: true,
        error: "You're already on the waitlist.",
      };
    }

    return { ok: false, error: msg || 'Failed to join waitlist' };
  }

  markClientSubmit();

  const link = referralLinkFor(referralCode);

  trackWaitlistJoined({
    email,
    source,
    referral: referredBy,
    wallet_connected: Boolean(wallet),
    country,
  });

  void triggerWelcomeEmail({
    email,
    name,
    referralCode,
    referralLink: link,
  });

  const notifyUrl = env.waitlistNotifyUrl();
  if (notifyUrl) {
    void fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'join',
        joiner_email: email,
        source: 'gami-web-supabase',
      }),
    }).catch(() => undefined);
  }

  return {
    ok: true,
    status: row.status,
    referralCode,
    referralLink: link,
  };
}

export async function fetchWaitlistPublicCount(): Promise<number | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('waitlist_public_count');
  if (error) return null;
  return typeof data === 'number' ? data : Number(data);
}
