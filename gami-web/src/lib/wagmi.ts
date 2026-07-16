import { createConfig as createPrivyConfig } from '@privy-io/wagmi';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arbitrum, base, baseSepolia, mainnet, optimism, polygon } from 'viem/chains';

import { env } from '@/lib/env';

const chainId = env.chainId();

/**
 * Sale settlement is on Base (or Base Sepolia in test).
 * Extra L1/L2 chains are included so Uniswap bridge quotes can be signed
 * from Ethereum / Arbitrum / Optimism / Polygon into Base USDC / GAMI.
 */
export const supportedChains =
  chainId === 8453
    ? ([base, mainnet, arbitrum, optimism, polygon] as const)
    : ([baseSepolia, base, mainnet, arbitrum, optimism, polygon] as const);

export const defaultChain = chainId === 8453 ? base : baseSepolia;

const transports = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
  [mainnet.id]: http(),
  [arbitrum.id]: http(),
  [optimism.id]: http(),
  [polygon.id]: http(),
} as const;

/** Privy drives connectors — do not pass injected here. */
export const privyWagmiConfig = createPrivyConfig({
  chains: supportedChains,
  transports,
});

/** Fallback when VITE_PRIVY_APP_ID is unset. */
export const legacyWagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [injected({ shimDisconnect: true })],
  transports,
});

export const wagmiConfig = env.privyAppId() ? privyWagmiConfig : legacyWagmiConfig;
