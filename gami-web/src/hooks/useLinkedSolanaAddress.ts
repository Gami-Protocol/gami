import { useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';

import { env } from '@/lib/env';

/** First linked Solana wallet address (Phantom / Solflare / Coinbase Solana), if any. */
export function useLinkedSolanaAddress(): string | undefined {
  const privyEnabled = Boolean(env.privyAppId());
  // usePrivy is only safe under PrivyProvider — Providers always mounts Privy when app id is set.
  const { user, ready } = usePrivy();

  return useMemo(() => {
    if (!privyEnabled || !ready || !user) return undefined;
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
  }, [privyEnabled, ready, user]);
}
