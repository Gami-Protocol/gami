import { useCallback, useState } from 'react';
import { useFundWallet } from '@privy-io/react-auth';
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

export type FundingProvider = 'ramp' | 'coinbase' | 'external';

type UsePaymentGatewayOptions = {
  address?: `0x${string}`;
  amountUsd?: string;
  onFunded?: () => void;
};

export function usePaymentGateway({ address, amountUsd, onFunded }: UsePaymentGatewayOptions) {
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      onFunded?.();
    },
  });
  const [busy, setBusy] = useState<FundingProvider | SwapAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requireWallet = useCallback(() => {
    if (!address) {
      throw new Error('Sign in with Privy to link your allocation wallet first.');
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
    externalFiatAvailable: Boolean(env.fiatOnrampUrl()),
    buyWithRamp,
    buyWithCoinbase,
    buyWithExternalFiat,
    swapToUsdc,
  };
}
