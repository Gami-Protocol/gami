/**
 * Chain configuration and viem clients for $GAMI on Base.
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  isAddress,
  parseEther,
  type Address,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';

import type { NovaProposal } from '@/lib/nova-tools';

export const GAMI_TOKEN_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
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

export function getTokenSaleAddress(chain: GamiChain): Address | null {
  const envKey =
    chain === 'baseSepolia'
      ? process.env.EXPO_PUBLIC_TOKEN_SALE_ADDRESS_SEPOLIA
      : process.env.EXPO_PUBLIC_TOKEN_SALE_ADDRESS;
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

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function validateNovaProposal(
  proposal: NovaProposal,
  account: Address,
  chain: GamiChain = getActiveChain(),
): string | null {
  if (proposal.chain !== chain) return `Proposal is for ${proposal.chain}, not ${chain}.`;
  if (proposal.from.toLowerCase() !== account.toLowerCase()) {
    return 'Proposal does not belong to the connected wallet.';
  }
  if (!isAddress(proposal.from)) return 'Connected wallet address is invalid.';
  if (proposal.kind === 'gami_claim') {
    return getVestingAddress(chain) ? null : 'Vesting contract is not configured.';
  }
  if (!getGamiTokenAddress(chain)) return 'GAMI token contract is not configured.';
  if (!isAddress(proposal.to)) return 'Recipient must be a valid 0x address.';
  try {
    if (parseEther(proposal.amount) <= 0n) return 'Transfer amount must be greater than zero.';
  } catch {
    return 'Transfer amount is invalid.';
  }
  return null;
}

/** Execute a previously previewed Nova proposal through the user's Privy provider. */
export async function executeNovaProposal(
  provider: Eip1193Provider,
  account: Address,
  proposal: NovaProposal,
): Promise<`0x${string}`> {
  const chain = getActiveChain();
  const validationError = validateNovaProposal(proposal, account, chain);
  if (validationError) throw new Error(validationError);

  if (proposal.kind === 'gami_claim') {
    return claimVestedTokens(provider, account, chain);
  }
  const tokenAddress = getGamiTokenAddress(chain);
  if (!tokenAddress) throw new Error('GAMI token contract is not configured');
  const walletClient = createWalletClient({
    account,
    chain: getChainConfig(chain),
    transport: custom(provider),
  });
  return walletClient.writeContract({
    address: tokenAddress,
    abi: GAMI_TOKEN_ABI,
    functionName: 'transfer',
    args: [proposal.to as Address, parseEther(proposal.amount)],
  });
}

/** Execute vesting.claim() via an EIP-1193 provider (Privy embedded wallet). */
export async function claimVestedTokens(
  provider: Eip1193Provider,
  account: Address,
  chain: GamiChain = getActiveChain(),
): Promise<`0x${string}`> {
  const vestingAddress = getVestingAddress(chain);
  if (!vestingAddress) throw new Error('Vesting contract not configured');

  const walletClient = createWalletClient({
    account,
    chain: getChainConfig(chain),
    transport: custom(provider),
  });

  return walletClient.writeContract({
    address: vestingAddress,
    abi: VESTING_ABI,
    functionName: 'claim',
  });
}

/** Log claim to Supabase edge function. */
export async function logClaimToBackend(input: {
  wallet_address: string;
  amount: string;
  tx_hash: string;
}): Promise<void> {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!base) return;
  await fetch(`${base}/functions/v1/log-claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}
