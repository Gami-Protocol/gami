import { parseUnits } from 'viem';

import { getContractAddress, getFunctionsBase, getSupabaseUrl } from '@/lib/contracts';
import { env } from '@/lib/env';
import { isFirebaseConfigured } from '@/lib/firebase';
import { joinWaitlistFirestore } from '@/lib/firebase-waitlist';
import { isSupabaseConfigured } from '@/lib/supabase';
import { joinWaitlistSupabase, type WaitlistJoinResult } from '@/lib/waitlist';

export interface SaleEligibility {
  wallet_address: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  phase: string;
  contributed_usd: number;
  allocation_gami: number;
  merkle_proof: `0x${string}`[];
  on_waitlist: boolean;
  participant_id: string | null;
}

export interface SaleStats {
  total_raised_usd: number;
  total_allocation_gami: number;
  participants_approved: number;
  waitlist_count: number;
  hard_cap_usd: number;
  current_phase: string;
  on_chain_raised_usdc?: number;
  updated_at?: string;
}

export async function fetchSaleStats(): Promise<SaleStats | null> {
  const base = getFunctionsBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/sale-stats`);
    if (!res.ok) return null;
    return (await res.json()) as SaleStats;
  } catch {
    return null;
  }
}

export async function fetchEligibility(wallet: string): Promise<SaleEligibility | null> {
  const base = getFunctionsBase();
  if (!base || !wallet.startsWith('0x')) return null;
  try {
    const res = await fetch(`${base}/sale-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: wallet }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SaleEligibility;
  } catch {
    return null;
  }
}

export async function joinWaitlist(input: {
  email: string;
  full_name?: string;
  name?: string;
  company?: string;
  role?: string;
  wallet_address?: string;
  wallet?: string;
  referral_code?: string;
  referred_by?: string;
  source?: string;
  country?: string;
  turnstileToken?: string;
}): Promise<WaitlistJoinResult> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@')) {
    return { ok: false, error: 'Valid email required' };
  }

  const name = (input.name ?? input.full_name ?? '').trim();
  const wallet = (input.wallet ?? input.wallet_address)?.trim().toLowerCase();
  const referredBy = (input.referred_by ?? input.referral_code)?.trim() || undefined;
  const source = input.source ?? 'website';

  // 1) Redesigned Next.js waitlist API (gami-site) when explicitly configured
  const waitlistApi = env.waitlistApiUrl();
  if (waitlistApi) {
    try {
      const res = await fetch(waitlistApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name || email.split('@')[0],
          email,
          company: input.company || '',
          walletAddress: wallet || '',
          referralCode: referredBy || '',
          role: input.role || 'community',
          interests: ['Wallet Beta'],
          turnstileToken: input.turnstileToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        referralCode?: string;
        referralLink?: string;
      };
      if (!res.ok || data.ok === false) {
        return { ok: false, error: data.error || 'Failed to join waitlist' };
      }
      return {
        ok: true,
        referralCode: data.referralCode,
        referralLink: data.referralLink,
      };
    } catch {
      // Fall through.
    }
  }

  // 2) Supabase (primary production backend)
  if (isSupabaseConfigured()) {
    return joinWaitlistSupabase({
      name: name || email.split('@')[0] || 'Pilot',
      email,
      company: input.company,
      wallet,
      role: input.role || 'community',
      referredBy,
      source,
      country: input.country,
      turnstileToken: input.turnstileToken,
    });
  }

  // 3) Firebase/Firestore when configured (and Supabase is not)
  if (isFirebaseConfigured()) {
    const result = await joinWaitlistFirestore({
      email,
      full_name: name || undefined,
      wallet_address: wallet,
      referral_code: referredBy,
      source,
    });
    return result;
  }

  const functionsBase = getFunctionsBase();
  if (functionsBase) {
    try {
      const res = await fetch(`${functionsBase}/waitlist-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: name || null,
          company: input.company ?? null,
          role: input.role ?? null,
          wallet_address: wallet ?? null,
          referred_by: referredBy ?? null,
          source,
          country: input.country ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        id?: string;
        status?: string;
        referral_code?: string;
        already?: boolean;
      };
      if (!res.ok || data.ok === false) {
        return { ok: false, error: data.error || 'Failed to join waitlist' };
      }
      return {
        ok: true,
        id: data.id,
        status: data.status,
        alreadyOnWaitlist: data.already,
        referralCode: data.referral_code,
      };
    } catch {
      // Fall through.
    }
  }

  const base = getSupabaseUrl();
  const key = env.supabaseAnonKey();
  if (!base || !key) {
    return {
      ok: false,
      error:
        'Backend not configured. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (recommended), VITE_WAITLIST_API_URL, or VITE_FIREBASE_*.',
    };
  }

  return {
    ok: false,
    error: 'Supabase client unavailable. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  };
}

export async function logClaimEvent(input: {
  wallet_address: string;
  amount: string;
  tx_hash: string;
}): Promise<void> {
  const base = getFunctionsBase();
  if (!base) return;
  await fetch(`${base}/log-claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}

export function previewGamiAllocation(usdcAmount6: bigint, pricePerToken: bigint): bigint {
  if (pricePerToken === 0n) return 0n;
  return (usdcAmount6 * 10n ** 18n) / pricePerToken;
}

export function parseStablecoinAmount(value: string, decimals = 6): bigint | null {
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(normalized)) return null;
  const fraction = normalized.split('.')[1];
  if (fraction && fraction.length > decimals) return null;

  try {
    const amount = parseUnits(normalized, decimals);
    return amount > 0n ? amount : null;
  } catch {
    return null;
  }
}

export function usdcToDisplay(amount6: bigint): number {
  return Number(amount6) / 1_000_000;
}

export function isSaleConfigured(): boolean {
  return Boolean(getContractAddress('TOKEN_SALE') && getContractAddress('USDC'));
}
