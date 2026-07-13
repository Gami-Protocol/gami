import { parseUnits } from 'viem';

import { getContractAddress, getFunctionsBase, getSupabaseUrl } from '@/lib/contracts';
import { env } from '@/lib/env';

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
  wallet_address?: string;
  referral_code?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const base = getSupabaseUrl();
  const key = env.supabaseAnonKey();
  if (!base || !key) return { ok: false, error: 'Backend not configured' };

  const res = await fetch(`${base}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      email: input.email,
      wallet_address: input.wallet_address ?? null,
      referral_code: input.referral_code ?? null,
      source: 'sale',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text || 'Failed to join waitlist' };
  }
  return { ok: true };
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
