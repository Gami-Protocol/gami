import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

export type SaleAccountState = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isLinking: boolean;
  authenticated: boolean;
  ready: boolean;
};

const SaleAccountContext = createContext<SaleAccountState | null>(null);

export function PrivySaleAccountProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();

  const value = useMemo<SaleAccountState>(() => {
    const privyAddress = wallets[0]?.address as `0x${string}` | undefined;
    const walletAddress = address ?? privyAddress;
    return {
      address: walletAddress,
      isConnected: Boolean(authenticated && walletAddress),
      isLinking: Boolean(authenticated && (!isConnected || !address)),
      authenticated,
      ready,
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
  };
}
