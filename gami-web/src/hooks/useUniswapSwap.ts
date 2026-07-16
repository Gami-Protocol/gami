import { useCallback, useState } from 'react';
import { useSendTransaction, useSwitchChain, useChainId } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { formatUnits, hexToBigInt, isHex } from 'viem';

import { getChainId } from '@/lib/contracts';
import {
  openExternalUrl,
  resolveCryptoSwapUrl,
  type SwapAsset,
} from '@/lib/payment-gateway';
import {
  checkApproval,
  createSwap,
  getQuote,
  quotedInputAmount,
  quotedOutputAmount,
  tokenInForSwapAsset,
  tokenOutUsdc,
  uniswapApiConfigured,
  UniswapTradeApiError,
  usdcAmountToBaseUnits,
  type QuoteResponse,
  type UniswapTx,
} from '@/lib/uniswap-trade-api';
import { wagmiConfig } from '@/lib/wagmi';

export type UniswapSwapPhase =
  | 'idle'
  | 'quoting'
  | 'quoted'
  | 'approving'
  | 'swapping'
  | 'confirming'
  | 'done'
  | 'error';

export type UniswapQuotePreview = {
  routing: string;
  amountIn: string;
  amountOut: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  gasFeeUsd?: string;
  tokenIn: string;
  tokenOut: string;
};

function txValue(value?: string): bigint {
  if (!value || value === '0' || value === '0x' || value === '0x0' || value === '0x00') {
    return 0n;
  }
  if (isHex(value)) return hexToBigInt(value);
  return BigInt(value);
}

function toSendTx(tx: UniswapTx) {
  return {
    to: tx.to,
    data: tx.data,
    value: txValue(tx.value),
    ...(tx.gasLimit ? { gas: BigInt(tx.gasLimit) } : {}),
  } as const;
}

function decimalsForToken(token: string): number {
  const lower = token.toLowerCase();
  if (lower === tokenOutUsdc().toLowerCase()) return 6;
  if (lower.endsWith('0000000000000000000000000000000000000000')) return 18;
  if (lower === '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2') return 6;
  return 18;
}

export function useUniswapSwap(options: {
  address?: `0x${string}`;
  amountUsd: string;
  onComplete?: () => void;
}) {
  const requiredChainId = getChainId();
  const connectedChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const [phase, setPhase] = useState<UniswapSwapPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<UniswapQuotePreview | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [pendingApproval, setPendingApproval] = useState<UniswapTx | null>(null);
  const [customToken, setCustomToken] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const clear = useCallback(() => {
    setPhase('idle');
    setError(null);
    setPreview(null);
    setQuote(null);
    setPendingApproval(null);
    setTxHash(null);
  }, []);

  const ensureNetwork = useCallback(async () => {
    if (connectedChainId !== requiredChainId) {
      await switchChainAsync({ chainId: requiredChainId });
    }
  }, [connectedChainId, requiredChainId, switchChainAsync]);

  const sendAndWait = useCallback(
    async (tx: UniswapTx) => {
      const hash = await sendTransactionAsync(toSendTx(tx));
      setTxHash(hash);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      return hash;
    },
    [sendTransactionAsync],
  );

  const fetchQuote = useCallback(
    async (from: SwapAsset) => {
      setError(null);
      setPreview(null);
      setQuote(null);
      setPendingApproval(null);
      setTxHash(null);

      if (!options.address) {
        setError('Sign in and link a wallet first.');
        setPhase('error');
        return;
      }
      if (!uniswapApiConfigured()) {
        setError('Uniswap Trading API is not configured (VITE_UNISWAP_API_KEY).');
        setPhase('error');
        return;
      }

      setPhase('quoting');
      try {
        const tokenIn = tokenInForSwapAsset(from, customToken.trim() || undefined);
        const tokenOut = tokenOutUsdc();
        const amountOut = usdcAmountToBaseUnits(options.amountUsd);

        const quoteResponse = await getQuote({
          swapper: options.address,
          tokenIn,
          tokenOut,
          amount: amountOut,
          type: 'EXACT_OUTPUT',
        });

        const amountIn = quotedInputAmount(quoteResponse);
        const out = quotedOutputAmount(quoteResponse) ?? amountOut;
        if (!amountIn) {
          throw new UniswapTradeApiError('Quote missing input amount.');
        }

        const approvalAmount = ((BigInt(amountIn) * 105n) / 100n).toString();
        const approval = await checkApproval({
          walletAddress: options.address,
          token: tokenIn,
          amount: approvalAmount,
        });

        setPendingApproval(approval.approval);
        setQuote(quoteResponse);
        setPreview({
          routing: String(quoteResponse.routing ?? 'CLASSIC'),
          amountIn,
          amountOut: out,
          amountInFormatted: formatUnits(BigInt(amountIn), decimalsForToken(tokenIn)),
          amountOutFormatted: formatUnits(BigInt(out), 6),
          gasFeeUsd: quoteResponse.quote?.gasFeeUSD,
          tokenIn,
          tokenOut,
        });
        setPhase('quoted');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to fetch Uniswap quote.';
        setError(message);
        setPhase('error');
      }
    },
    [customToken, options.address, options.amountUsd],
  );

  const executeSwap = useCallback(async () => {
    if (!options.address || !quote || !preview) {
      setError('Fetch a quote before swapping.');
      setPhase('error');
      return;
    }

    setError(null);
    try {
      await ensureNetwork();

      if (pendingApproval) {
        setPhase('approving');
        await sendAndWait(pendingApproval);
      }

      setPhase('swapping');
      const freshQuote = await getQuote({
        swapper: options.address,
        tokenIn: preview.tokenIn,
        tokenOut: preview.tokenOut,
        amount: preview.amountOut,
        type: 'EXACT_OUTPUT',
      });

      const amountIn = quotedInputAmount(freshQuote);
      if (amountIn) {
        const approval = await checkApproval({
          walletAddress: options.address,
          token: preview.tokenIn,
          amount: ((BigInt(amountIn) * 105n) / 100n).toString(),
        });
        if (approval.approval) {
          setPhase('approving');
          await sendAndWait(approval.approval);
          setPhase('swapping');
        }
      }

      const swapResponse = await createSwap(freshQuote);
      setPhase('confirming');
      await sendAndWait(swapResponse.swap);
      setPhase('done');
      options.onComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed.';
      if (!/user rejected|denied|cancel/i.test(message)) {
        setError(message);
      }
      setPhase('error');
    }
  }, [ensureNetwork, options, pendingApproval, preview, quote, sendAndWait]);

  const openDeepLinkFallback = useCallback(
    (from: SwapAsset) => {
      if (!options.address) {
        setError('Sign in and link a wallet first.');
        return;
      }
      openExternalUrl(resolveCryptoSwapUrl(from, options.address, options.amountUsd));
    },
    [options.address, options.amountUsd],
  );

  return {
    phase,
    error,
    preview,
    pendingApproval,
    customToken,
    setCustomToken,
    apiConfigured: uniswapApiConfigured(),
    txHash,
    clear,
    fetchQuote,
    executeSwap,
    openDeepLinkFallback,
  };
}
