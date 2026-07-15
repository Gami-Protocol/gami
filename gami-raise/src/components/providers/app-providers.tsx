'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

import { env } from '@/lib/env';
import { defaultChain, supportedChains, wagmiConfig } from '@/lib/wagmi';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const privyAppId = env.privyAppId();

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'google', 'apple', 'twitter', 'discord', 'github', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#6C3BFF',
          logo: '/brand/mark.svg',
          walletChainType: 'ethereum-only',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        supportedChains: [...supportedChains],
        defaultChain,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
          <Toaster theme="dark" position="top-right" richColors />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
