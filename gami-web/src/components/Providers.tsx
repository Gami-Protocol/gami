import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';
import { WagmiProvider } from 'wagmi';
import { useState, type ReactNode } from 'react';

import { SyncPrivyWallet } from '@/components/SyncPrivyWallet';
import { FirebaseAuthProvider } from '@/hooks/useFirebaseAuth';
import { LinkedSolanaAddressProvider } from '@/hooks/useLinkedSolanaAddress';
import { PrivySaleAccountProvider } from '@/hooks/useSaleAccount';
import { env } from '@/lib/env';
import { PRIVY_WALLET_CHAIN_TYPE, PRIVY_WALLET_LIST } from '@/lib/privy-wallets';
import { defaultChain, legacyWagmiConfig, privyWagmiConfig, supportedChains } from '@/lib/wagmi';

const solanaConnectors = toSolanaWalletConnectors({
  // Avoid surprise extension popups on every page load.
  shouldAutoConnect: false,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const privyAppId = env.privyAppId();

  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <FirebaseAuthProvider>
          <WagmiProvider config={legacyWagmiConfig}>{children}</WagmiProvider>
        </FirebaseAuthProvider>
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
          walletChainType: PRIVY_WALLET_CHAIN_TYPE,
          showWalletLoginFirst: false,
          walletList: [...PRIVY_WALLET_LIST],
        },
        ...(env.walletConnectProjectId()
          ? { walletConnectCloudProjectId: env.walletConnectProjectId() }
          : {}),
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        // Card / Coinbase funding for sale participants (USDC on Base + Solana fund path).
        fundingMethodConfig: {
          moonpay: {
            useSandbox: env.chainId() !== 8453,
          },
        },
        supportedChains: [...supportedChains],
        defaultChain,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <FirebaseAuthProvider>
          <PrivyWagmiProvider config={privyWagmiConfig}>
            <SyncPrivyWallet />
            <LinkedSolanaAddressProvider>
              <PrivySaleAccountProvider>{children}</PrivySaleAccountProvider>
            </LinkedSolanaAddressProvider>
          </PrivyWagmiProvider>
        </FirebaseAuthProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
