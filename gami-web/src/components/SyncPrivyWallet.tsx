import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useAccount } from 'wagmi';

import { readPreferredWalletAddress } from '@/lib/wallet-labels';

/**
 * Bootstraps wagmi's active account from the Privy session when none is selected.
 * Honors a user-preferred wallet (external or Privy email) and never overrides an
 * already-active matching account.
 */
export function SyncPrivyWallet() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { address } = useAccount();
  const lastBootstrapKey = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || wallets.length === 0) return;

    const current = address?.toLowerCase();
    const alreadyActive = wallets.some((wallet) => wallet.address.toLowerCase() === current);
    if (alreadyActive) return;

    // Wait until Privy wallet list catches up if wagmi briefly has a foreign address.
    if (address && !alreadyActive) return;

    const preferredAddress = readPreferredWalletAddress();
    const preferred =
      (preferredAddress
        ? wallets.find((wallet) => wallet.address.toLowerCase() === preferredAddress)
        : undefined) ??
      wallets.find((wallet) => wallet.walletClientType === 'privy') ??
      wallets[0];

    const key = `${preferred.address.toLowerCase()}:${wallets.length}`;
    if (lastBootstrapKey.current === key) return;
    lastBootstrapKey.current = key;

    void setActiveWallet(preferred);
  }, [address, authenticated, ready, setActiveWallet, wallets]);

  return null;
}
