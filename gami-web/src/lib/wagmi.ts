import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { base, baseSepolia } from 'viem/chains';

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532);
const chains = chainId === 8453 ? [base] as const : [baseSepolia] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
