import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const LinkedSolanaAddressContext = createContext<string | undefined>(undefined);

/**
 * Provides the first linked Solana wallet address.
 * Must mount under PrivyProvider (see Providers).
 */
export function LinkedSolanaAddressProvider({ children }: { children: ReactNode }) {
  const { user, ready } = usePrivy();

  const address = useMemo(() => {
    if (!ready || !user) return undefined;
    const accounts = user.linkedAccounts ?? [];
    for (const account of accounts) {
      if (
        account.type === 'wallet' &&
        'chainType' in account &&
        account.chainType === 'solana' &&
        'address' in account &&
        typeof account.address === 'string' &&
        account.address.length > 0
      ) {
        return account.address;
      }
    }
    return undefined;
  }, [ready, user]);

  return (
    <LinkedSolanaAddressContext.Provider value={address}>
      {children}
    </LinkedSolanaAddressContext.Provider>
  );
}

/** First linked Solana wallet address, if Privy Solana linking is active. */
export function useLinkedSolanaAddress(): string | undefined {
  return useContext(LinkedSolanaAddressContext);
}
