import { useCallback, useState } from 'react';
import { useFundWallet } from '@privy-io/react-auth';
import { useFundWallet as useFundSolanaWallet } from '@privy-io/react-auth/solana';
import { base, baseSepolia } from 'viem/chains';

import { getChainId, getContractAddress } from '@/lib/contracts';
import { env } from '@/lib/env';
import {
  coinbaseOnrampAvailable,
  fiatGatewayAvailable,
  interpolatePaymentUrl,
  launchRamp,
  openExternalUrl,
  rampConfigured,
  resolveCryptoSwapUrl,
  settlementUsdcAddress,
  swapGatewayAvailable,
  type SwapAsset,
} from '@/lib/payment-gateway';

export type FundingProvider =
  | 'ramp'
  | 'coinbase'
  | 'coinbase-solana'
  | 'external'
  | SwapAsset;

type UsePaymentGatewayOptions = {
  address?: `0x${string}`;
  /** Optional linked Solana address for Coinbase Solana card funding. */
  solanaAddress?: string;
  amountUsd?: string;
  onFunded?: () => void;
};

export function usePaymentGateway({
  address,
  solanaAddress,
  amountUsd,
  onFunded,
}: UsePaymentGatewayOptions) {
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      onFunded?.();
    },
  });
  const { fundWallet: fundSolanaWallet } = useFundSolanaWallet({
    onUserExited: () => {
      onFunded?.();
    },
  });
  const [busy, setBusy] = useState<FundingProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requireWallet = useCallback(() => {
    if (!address) {
      throw new Error('Sign in and add your allocation wallet first.');
    }
    return address;
  }, [address]);

  const buyWithRamp = useCallback(async () => {
    setError(null);
    setBusy('ramp');
    try {
      const wallet = requireWallet();
      if (!rampConfigured()) {
        throw new Error('Ramp is not configured. Set VITE_RAMP_HOST_API_KEY or use Coinbase.');
      }
      launchRamp({
        wallet,
        amountUsd,
      });
      onFunded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open Ramp.');
    } finally {
      setBusy(null);
    }
  }, [amountUsd, onFunded, requireWallet]);

  const buyWithCoinbase = useCallback(async () => {
    setError(null);
    setBusy('coinbase');
    try {
      const wallet = requireWallet();
      if (!coinbaseOnrampAvailable()) {
        throw new Error('Coinbase on-ramp requires Privy (VITE_PRIVY_APP_ID).');
      }

      const chain = getChainId() === 8453 ? base : baseSepolia;
      const usdc = getContractAddress('USDC');

      await fundWallet({
        address: wallet,
        options: {
          chain,
          amount: amountUsd && Number(amountUsd) > 0 ? amountUsd : undefined,
          asset: usdc ? { erc20: usdc } : 'USDC',
          defaultFundingMethod: 'card',
          card: { preferredProvider: 'coinbase' },
        },
      });
      onFunded?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Coinbase funding was cancelled.';
      if (!/exited|cancel|closed/i.test(message)) {
        setError(message);
      }
    } finally {
      setBusy(null);
    }
  }, [amountUsd, fundWallet, onFunded, requireWallet]);

  const buyWithCoinbaseSolana = useCallback(async () => {
    setError(null);
    setBusy('coinbase-solana');
    try {
      if (!coinbaseOnrampAvailable()) {
        throw new Error('Coinbase on-ramp requires Privy (VITE_PRIVY_APP_ID).');
      }
      if (!solanaAddress) {
        throw new Error(
          'Link a Solana wallet (Phantom, Solflare, or Coinbase) first, then fund with card.',
        );
      }

      await fundSolanaWallet({
        address: solanaAddress,
        options: {
          chain: 'solana:mainnet',
          amount: amountUsd && Number(amountUsd) > 0 ? amountUsd : undefined,
          asset: 'USDC',
          defaultFundingMethod: 'card',
          card: { preferredProvider: 'coinbase' },
        },
      });
      onFunded?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Coinbase Solana funding was cancelled.';
      if (!/exited|cancel|closed/i.test(message)) {
        setError(message);
      }
    } finally {
      setBusy(null);
    }
  }, [amountUsd, fundSolanaWallet, onFunded, solanaAddress]);

  const buyWithExternalFiat = useCallback(() => {
    setError(null);
    const template = env.fiatOnrampUrl();
    if (!template) {
      setError('No external fiat on-ramp URL configured.');
      return;
    }
    try {
      const wallet = requireWallet();
      openExternalUrl(
        interpolatePaymentUrl(template, {
          wallet,
          amount: amountUsd,
          usdc: settlementUsdcAddress(),
        }),
      );
      onFunded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open fiat on-ramp.');
    }
  }, [amountUsd, onFunded, requireWallet]);

  const swapToUsdc = useCallback(
    (from: SwapAsset) => {
      setError(null);
      setBusy(from);
      try {
        const wallet = requireWallet();
        openExternalUrl(resolveCryptoSwapUrl(from, wallet, amountUsd));
        onFunded?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to open swap.');
      } finally {
        setBusy(null);
      }
    },
    [amountUsd, onFunded, requireWallet],
  );

  return {
    busy,
    error,
    clearError: () => setError(null),
    fiatAvailable: fiatGatewayAvailable(),
    swapAvailable: swapGatewayAvailable(),
    rampAvailable: rampConfigured(),
    coinbaseAvailable: coinbaseOnrampAvailable(),
    coinbaseSolanaAvailable: coinbaseOnrampAvailable() && Boolean(solanaAddress),
    hasSolanaWallet: Boolean(solanaAddress),
    externalFiatAvailable: Boolean(env.fiatOnrampUrl()),
    buyWithRamp,
    buyWithCoinbase,
    buyWithCoinbaseSolana,
    buyWithExternalFiat,
    swapToUsdc,
  };
}
