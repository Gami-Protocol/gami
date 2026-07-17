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
  full_name?: string;
  wallet_address?: string;
  referral_code?: string;
  source?: string;
}): Promise<{ ok: boolean; error?: string; id?: string; status?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@')) {
    return { ok: false, error: 'Valid email required' };
  }

  const wallet = input.wallet_address?.trim()
    ? input.wallet_address.trim().toLowerCase()
    : undefined;
  const payload = {
    email,
    full_name: input.full_name?.trim() || null,
    wallet_address: wallet ?? null,
    referral_code: input.referral_code?.trim() || null,
    source: input.source ?? 'web',
  };

  const functionsBase = getFunctionsBase();
  if (functionsBase) {
    try {
      const res = await fetch(`${functionsBase}/waitlist-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        id?: string;
        status?: string;
      };
      if (!res.ok || data.ok === false) {
        return { ok: false, error: data.error || 'Failed to join waitlist' };
      }
      return { ok: true, id: data.id, status: data.status };
    } catch {
      // Fall through to direct Rest insert when the edge function is unavailable.
    }
  }

  const base = getSupabaseUrl();
  const key = env.supabaseAnonKey();
  if (!base || !key) return { ok: false, error: 'Backend not configured' };

  const res = await fetch(`${base}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    // Duplicate email: treat as success so re-submits from the UI are friendly.
    if (res.status === 409 || text.includes('duplicate key') || text.includes('23505')) {
      return { ok: true };
    }
    return { ok: false, error: text || 'Failed to join waitlist' };
  }

  const rows = (await res.json().catch(() => null)) as Array<{ id?: string; status?: string }> | null;
  return { ok: true, id: rows?.[0]?.id, status: rows?.[0]?.status };
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
