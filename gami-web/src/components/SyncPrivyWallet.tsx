import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useAccount } from 'wagmi';

/**
 * Keeps wagmi's active account in sync with the Privy login session so
 * useAccount / write hooks work for embedded and external Privy wallets.
 */
export function SyncPrivyWallet() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { address } = useAccount();

  useEffect(() => {
    if (!ready || !authenticated || wallets.length === 0) return;

    const current = address?.toLowerCase();
    const alreadyActive = wallets.some((wallet) => wallet.address.toLowerCase() === current);
    if (alreadyActive) return;

    const preferred =
      wallets.find((wallet) => wallet.walletClientType === 'privy') ?? wallets[0];
    void setActiveWallet(preferred);
  }, [address, authenticated, ready, setActiveWallet, wallets]);

  return null;
}
