/**
 * Gami Protocol on-chain client.
 *
 * Wraps the IGamiXP and IGamiTreasury EVM precompiles exposed by the
 * gami-protocol-chain Cosmos SDK node. When EXPO_PUBLIC_GAMI_RPC_URL is set
 * the app reads real XP, level, and budget data straight from the chain;
 * otherwise every function returns null and callers fall back to the local
 * mock store.
 *
 * Precompile addresses (from gami-protocol-chain/wallet-sdk):
 *   IGamiXP       0x0000000000000000000000000000000000000800
 *   IGamiTreasury 0x0000000000000000000000000000000000000801
 */

import { createPublicClient, defineChain, http, type Address, type PublicClient } from 'viem';

// ── Chain definition ──────────────────────────────────────────────────────────

export const gamiChain = defineChain({
  id: 1337,
  name: 'Gami Protocol',
  nativeCurrency: { name: 'GAMI', symbol: 'GAMI', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.EXPO_PUBLIC_GAMI_RPC_URL ?? 'http://localhost:8545'],
    },
  },
});

// ── Precompile addresses ──────────────────────────────────────────────────────

export const GAMIXP_PRECOMPILE = '0x0000000000000000000000000000000000000800' as const;
export const GAMI_TREASURY_PRECOMPILE =
  '0x0000000000000000000000000000000000000801' as const;

// ── ABIs (mirrored from gami-protocol-chain/wallet-sdk/src/GamiWallet.ts) ────

export const GAMIXP_ABI = [
  {
    type: 'function',
    name: 'addXP',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getLevel',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'level', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalXP',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'xp', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'LevelUp',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'newLevel', type: 'uint256', indexed: false },
      { name: 'totalXP', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const TREASURY_ABI = [
  {
    type: 'function',
    name: 'checkBudget',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [
      { name: 'allowed', type: 'bool' },
      { name: 'remaining', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getInflationRate',
    inputs: [],
    outputs: [{ name: 'rate', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentBudget {
  allowed: boolean;
  remaining: bigint;
}

// ── Client factory ────────────────────────────────────────────────────────────

export function createChainPublicClient(rpcUrl: string): PublicClient {
  return createPublicClient({
    chain: {
      ...gamiChain,
      rpcUrls: { default: { http: [rpcUrl] } },
    },
    transport: http(rpcUrl),
  });
}

// ── Precompile helpers ────────────────────────────────────────────────────────

/** Read the on-chain total XP for an address. Returns null on any error. */
export async function getOnChainXP(address: Address, rpcUrl: string): Promise<bigint | null> {
  try {
    const client = createChainPublicClient(rpcUrl);
    return (await client.readContract({
      address: GAMIXP_PRECOMPILE,
      abi: GAMIXP_ABI,
      functionName: 'getTotalXP',
      args: [address],
    })) as bigint;
  } catch {
    return null;
  }
}

/** Read the on-chain cached level for an address. Returns null on any error. */
export async function getOnChainLevel(address: Address, rpcUrl: string): Promise<bigint | null> {
  try {
    const client = createChainPublicClient(rpcUrl);
    return (await client.readContract({
      address: GAMIXP_PRECOMPILE,
      abi: GAMIXP_ABI,
      functionName: 'getLevel',
      args: [address],
    })) as bigint;
  } catch {
    return null;
  }
}

/**
 * Check whether an AI agent address has remaining Treasury budget.
 * Returns null when the chain is unreachable.
 */
export async function checkAgentBudget(
  agentAddress: Address,
  amount: bigint,
  rpcUrl: string,
): Promise<AgentBudget | null> {
  try {
    const client = createChainPublicClient(rpcUrl);
    const result = (await client.readContract({
      address: GAMI_TREASURY_PRECOMPILE,
      abi: TREASURY_ABI,
      functionName: 'checkBudget',
      args: [agentAddress, amount],
    })) as [boolean, bigint];
    return { allowed: result[0], remaining: result[1] };
  } catch {
    return null;
  }
}

/**
 * Subscribe to on-chain LevelUp events for a specific user address.
 * Returns an unwatch function; call it to cancel the subscription.
 * Silently no-ops when the chain is unreachable.
 */
export function watchLevelUpEvents(
  userAddress: Address,
  rpcUrl: string,
  onLevelUp: (newLevel: bigint, totalXP: bigint) => void,
): () => void {
  try {
    const client = createChainPublicClient(rpcUrl);
    return client.watchContractEvent({
      address: GAMIXP_PRECOMPILE,
      abi: GAMIXP_ABI,
      eventName: 'LevelUp',
      args: { user: userAddress },
      onLogs: (logs) => {
        for (const log of logs) {
          const typed = log as unknown as {
            args?: { newLevel?: bigint; totalXP?: bigint };
          };
          if (typed.args?.newLevel != null && typed.args?.totalXP != null) {
            onLevelUp(typed.args.newLevel, typed.args.totalXP);
          }
        }
      },
    });
  } catch {
    return () => {};
  }
}
