import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import { Alert } from 'react-native';
import type { Address } from 'viem';

import { GButtonPrimary } from '@/components/gami';
import { claimVestedTokens, getActiveChain, logClaimToBackend } from '@/lib/chain';

interface Props {
  claimable: number;
  claiming: boolean;
  setClaiming: (v: boolean) => void;
  onSuccess: () => void;
  onFallback: () => void;
}

export function PrivyClaimButton({
  claimable,
  claiming,
  setClaiming,
  onSuccess,
  onFallback,
}: Props) {
  const { wallets } = useEmbeddedEthereumWallet();

  const handleClaim = async () => {
    const embedded = wallets?.[0];
    if (!embedded?.address) {
      onFallback();
      return;
    }

    setClaiming(true);
    try {
      const provider = await embedded.getProvider();
      const hash = await claimVestedTokens(
        provider as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
        embedded.address as Address,
        getActiveChain(),
      );
      await logClaimToBackend({
        wallet_address: embedded.address,
        amount: String(claimable),
        tx_hash: hash,
      });
      onSuccess();
    } catch (err) {
      Alert.alert(
        'Claim failed',
        err instanceof Error ? err.message : 'Use the web claim portal as a fallback.',
      );
    } finally {
      setClaiming(false);
    }
  };

  return (
    <GButtonPrimary
      className="mt-6"
      label={claiming ? 'CLAIMING…' : 'CLAIM NOW →'}
      onPress={() => void handleClaim()}
    />
  );
}
