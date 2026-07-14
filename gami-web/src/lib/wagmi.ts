import { createConfig as createPrivyConfig } from '@privy-io/wagmi';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { base, baseSepolia } from 'viem/chains';

import { env } from '@/lib/env';

const chainId = env.chainId();
export const supportedChains = chainId === 8453 ? ([base] as const) : ([baseSepolia] as const);
export const defaultChain = supportedChains[0];

const transports = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
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
