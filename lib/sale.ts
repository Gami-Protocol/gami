/**
 * Mobile ICO / sale API client.
 */

import { FUNCTIONS_URL } from '@/lib/supabase';

export interface SaleStats {
  total_raised_usd: number;
  total_allocation_gami: number;
  participants_approved: number;
  waitlist_count: number;
  hard_cap_usd: number;
  current_phase: string;
  on_chain_raised_usdc?: number;
}

export interface SaleEligibility {
  wallet_address: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  phase: string;
  contributed_usd: number;
  allocation_gami: number;
  on_waitlist: boolean;
  participant_id: string | null;
}

function functionsBase(): string | null {
  return FUNCTIONS_URL || null;
}

export async function fetchSaleStats(): Promise<SaleStats | null> {
  const base = functionsBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/sale-stats`);
    if (!res.ok) return null;
    return (await res.json()) as SaleStats;
  } catch {
    return null;
  }
}

export async function fetchSaleEligibility(wallet: string): Promise<SaleEligibility | null> {
  const base = functionsBase();
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

export function buildContributeUrl(wallet?: string | null, referralCode?: string | null): string {
  const base = process.env.EXPO_PUBLIC_ICO_WEB_URL ?? 'https://gami.xyz';
  const url = new URL(`${base.replace(/\/$/, '')}/sale/contribute`);
  if (wallet?.startsWith('0x')) url.searchParams.set('wallet', wallet);
  if (referralCode) url.searchParams.set('ref', referralCode);
  return url.toString();
}

export function mapPhaseToStore(
  phase: string,
): 'waitlist' | 'seed' | 'private' | 'public' | 'closed' | null {
  const p = phase.toLowerCase();
  if (p === 'seed' || p === 'private' || p === 'public' || p === 'closed' || p === 'waitlist') {
    return p;
  }
  return 'public';
}
