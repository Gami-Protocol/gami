'use client';

import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { base, baseSepolia } from 'viem/chains';

import { env } from '@/lib/env';

const chainId = env.chainId();
export const supportedChains = chainId === 8453 ? ([base] as const) : ([baseSepolia] as const);
export const defaultChain = supportedChains[0];

export const wagmiConfig = createConfig({
  chains: supportedChains,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
