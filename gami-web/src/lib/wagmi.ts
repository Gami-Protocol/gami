import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { base, baseSepolia } from 'viem/chains';

import { env } from '@/lib/env';

const chainId = env.chainId();
const chains = chainId === 8453 ? ([base] as const) : ([baseSepolia] as const);

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
