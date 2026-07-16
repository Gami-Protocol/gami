import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePrivy, useWallets, type ConnectedWallet } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

import { isPrivyEmbeddedWallet, walletTypeLabel } from '@/lib/wallet-labels';

export type SaleAccountState = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isLinking: boolean;
  authenticated: boolean;
  ready: boolean;
  wallets: ConnectedWallet[];
  activeWallet?: ConnectedWallet;
  embeddedWallet?: ConnectedWallet;
  isEmbedded: boolean;
  walletLabel: string | null;
};

const SaleAccountContext = createContext<SaleAccountState | null>(null);

export function PrivySaleAccountProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();

  const value = useMemo<SaleAccountState>(() => {
    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    const activeWallet =
      (address
        ? wallets.find((wallet) => wallet.address.toLowerCase() === address.toLowerCase())
        : undefined) ??
      embeddedWallet ??
      wallets[0];
    const walletAddress = (address ?? activeWallet?.address) as `0x${string}` | undefined;

    return {
      address: walletAddress,
      isConnected: Boolean(authenticated && walletAddress),
      isLinking: Boolean(authenticated && (!isConnected || !address)),
      authenticated,
      ready,
      wallets,
      activeWallet,
      embeddedWallet,
      isEmbedded: Boolean(activeWallet && isPrivyEmbeddedWallet(activeWallet)),
      walletLabel: activeWallet ? walletTypeLabel(activeWallet) : null,
    };
  }, [address, authenticated, isConnected, ready, wallets]);

  return <SaleAccountContext.Provider value={value}>{children}</SaleAccountContext.Provider>;
}

export function useSaleAccount(): SaleAccountState {
  const ctx = useContext(SaleAccountContext);
  const { address, isConnected } = useAccount();

  if (ctx) return ctx;

  return {
    address,
    isConnected,
    isLinking: false,
    authenticated: isConnected,
    ready: true,
    wallets: [],
    activeWallet: undefined,
    embeddedWallet: undefined,
    isEmbedded: false,
    walletLabel: null,
  };
}
