import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { WagmiProvider } from 'wagmi';
import { useState, type ReactNode } from 'react';

import { SyncPrivyWallet } from '@/components/SyncPrivyWallet';
import { PrivySaleAccountProvider } from '@/hooks/useSaleAccount';
import { env } from '@/lib/env';
import { defaultChain, legacyWagmiConfig, privyWagmiConfig, supportedChains } from '@/lib/wagmi';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const privyAppId = env.privyAppId();

  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={legacyWagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#6E3CFB',
          walletChainType: 'ethereum-only',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            // Every sale participant needs an allocation wallet, including email logins.
            createOnLogin: 'all-users',
          },
        },
        supportedChains: [...supportedChains],
        defaultChain,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={privyWagmiConfig}>
          <SyncPrivyWallet />
          <PrivySaleAccountProvider>{children}</PrivySaleAccountProvider>
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
