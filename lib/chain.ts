/**
 * Chain configuration and viem clients for $GAMI on Base.
 */

import { createPublicClient, formatEther, http, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export const GAMI_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
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
  {
    name: 'schedules',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimed', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'cliffDuration', type: 'uint256' },
      { name: 'vestingDuration', type: 'uint256' },
      { name: 'tgeUnlockBps', type: 'uint256' },
    ],
  },
] as const;

export type GamiChain = 'base' | 'baseSepolia';

function getChainConfig(chain: GamiChain) {
  return chain === 'baseSepolia' ? baseSepolia : base;
}

function getRpcUrl(chain: GamiChain): string | undefined {
  if (chain === 'baseSepolia') {
    return process.env.EXPO_PUBLIC_BASE_SEPOLIA_RPC;
  }
  return process.env.EXPO_PUBLIC_BASE_RPC;
}

export function getGamiTokenAddress(chain: GamiChain): Address | null {
  const envKey =
    chain === 'baseSepolia'
      ? process.env.EXPO_PUBLIC_GAMI_TOKEN_ADDRESS_SEPOLIA
      : process.env.EXPO_PUBLIC_GAMI_TOKEN_ADDRESS;
  if (!envKey || !envKey.startsWith('0x')) return null;
  return envKey as Address;
}

export function getVestingAddress(chain: GamiChain): Address | null {
  const envKey =
    chain === 'baseSepolia'
      ? process.env.EXPO_PUBLIC_VESTING_ADDRESS_SEPOLIA
      : process.env.EXPO_PUBLIC_VESTING_ADDRESS;
  if (!envKey || !envKey.startsWith('0x')) return null;
  return envKey as Address;
}

export function getActiveChain(): GamiChain {
  const env = process.env.EXPO_PUBLIC_GAMI_CHAIN ?? 'baseSepolia';
  return env === 'base' ? 'base' : 'baseSepolia';
}

export function createGamiPublicClient(chain: GamiChain = getActiveChain()) {
  const rpc = getRpcUrl(chain);
  return createPublicClient({
    chain: getChainConfig(chain),
    transport: http(rpc),
  });
}

/** Read on-chain $GAMI balance. Returns null if contract not configured. */
export async function fetchGamiBalance(
  address: Address,
  chain: GamiChain = getActiveChain(),
): Promise<number | null> {
  const tokenAddress = getGamiTokenAddress(chain);
  if (!tokenAddress) return null;

  try {
    const client = createGamiPublicClient(chain);
    const raw = await client.readContract({
      address: tokenAddress,
      abi: GAMI_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    return Number(formatEther(raw));
  } catch {
    return null;
  }
}

/** Read claimable vested $GAMI. Returns null if vesting not configured. */
export async function fetchClaimableGami(
  address: Address,
  chain: GamiChain = getActiveChain(),
): Promise<number | null> {
  const vestingAddress = getVestingAddress(chain);
  if (!vestingAddress) return null;

  try {
    const client = createGamiPublicClient(chain);
    const raw = await client.readContract({
      address: vestingAddress,
      abi: VESTING_ABI,
      functionName: 'claimable',
      args: [address],
    });
    return Number(formatEther(raw));
  } catch {
    return null;
  }
}
