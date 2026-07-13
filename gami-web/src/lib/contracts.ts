import { base, baseSepolia } from 'viem/chains';

import { env } from '@/lib/env';

export const GAMI_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const USDC_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export const TOKEN_SALE_ABI = [
  {
    name: 'contributeUSDC',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' },
    ],
    outputs: [],
  },
  {
    name: 'totalRaised',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pricePerToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'hardCap',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'perWalletCap',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'currentPhase',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'contributed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allocation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const VESTING_ABI = [
  {
    name: 'claimable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

export type SalePhase = 'closed' | 'seed' | 'private' | 'public';

const PHASE_NAMES: SalePhase[] = ['closed', 'seed', 'private', 'public'];

export function phaseFromIndex(index: number): SalePhase {
  return PHASE_NAMES[index] ?? 'closed';
}

export function getChainId(): number {
  return env.chainId();
}

export function getActiveChain() {
  return getChainId() === 8453 ? base : baseSepolia;
}

export function getContractAddress(
  key: 'GAMI' | 'VESTING' | 'TOKEN_SALE' | 'USDC',
): `0x${string}` | null {
  const map: Record<string, string | undefined> = {
    GAMI: env.gamiTokenAddress(),
    VESTING: env.vestingAddress(),
    TOKEN_SALE: env.tokenSaleAddress(),
    USDC: env.usdcAddress(),
  };
  const addr = map[key];
  if (!addr || !addr.startsWith('0x')) return null;
  return addr as `0x${string}`;
}

export function getSupabaseUrl(): string | null {
  return env.supabaseUrl() ?? null;
}

export function getFunctionsBase(): string | null {
  const explicit = env.supabaseFunctionsUrl();
  if (explicit) return explicit.replace(/\/$/, '');
  const supabase = getSupabaseUrl();
  return supabase ? `${supabase}/functions/v1` : null;
}

export function getExplorerTxUrl(chainId: number, hash: string): string {
  const baseUrl = chainId === 8453 ? 'https://basescan.org' : 'https://sepolia.basescan.org';
  return `${baseUrl}/tx/${hash}`;
}
