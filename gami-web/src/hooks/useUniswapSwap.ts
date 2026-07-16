import { useCallback, useState } from 'react';
import { useSendTransaction, useSwitchChain, useChainId } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { formatUnits, hexToBigInt, isHex } from 'viem';

import {
  openExternalUrl,
  resolveCryptoSwapUrl,
  type SwapAsset,
} from '@/lib/payment-gateway';
import {
  BASE_USDC,
  BRIDGE_SOURCE_CHAINS,
  explorerTxUrl,
  GAMI_CHAIN_ID,
  isCrossChain,
  tokenDecimals,
  type BridgeAssetSymbol,
  type BridgeSourceChainId,
} from '@/lib/uniswap-chains';
import {
  checkApproval,
  destinationAmountBaseUnits,
  executeQuote,
  getQuote,
  gamiTokenOnBase,
  quotedInputAmount,
  quotedOutputAmount,
  resolveTokenIn,
  resolveTokenOut,
  uniswapApiConfigured,
  UniswapTradeApiError,
  type QuoteResponse,
  type TradeDestination,
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
  bridgeFee?: string;
  estimatedFillTime?: string;
  tokenIn: string;
  tokenOut: string;
  tokenInChainId: number;
  tokenOutChainId: number;
  destination: TradeDestination;
  crossChain: boolean;
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
    ...(tx.chainId ? { chainId: tx.chainId } : {}),
  } as const;
}

function outDecimals(destination: TradeDestination): number {
  return destination === 'gami' ? 18 : 6;
}

function mapSwapAsset(asset: SwapAsset): BridgeAssetSymbol | 'OTHER' {
  if (asset === 'usdt') return 'USDT';
  if (asset === 'eth') return 'ETH';
  return 'OTHER';
}

export function useUniswapSwap(options: {
  address?: `0x${string}`;
  amountUsd: string;
  onComplete?: () => void;
}) {
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
  const [sourceChainId, setSourceChainId] = useState<BridgeSourceChainId>(GAMI_CHAIN_ID);
  const [destination, setDestination] = useState<TradeDestination>('usdc');

  const clear = useCallback(() => {
    setPhase('idle');
    setError(null);
    setPreview(null);
    setQuote(null);
    setPendingApproval(null);
    setTxHash(null);
  }, []);

  const ensureSourceNetwork = useCallback(
    async (chainId: number) => {
      if (connectedChainId !== chainId) {
        await switchChainAsync({ chainId });
      }
    },
    [connectedChainId, switchChainAsync],
  );

  const sendAndWait = useCallback(
    async (tx: UniswapTx, chainId: number) => {
      await ensureSourceNetwork(chainId);
      const hash = await sendTransactionAsync(toSendTx(tx));
      setTxHash(hash);
      await waitForTransactionReceipt(wagmiConfig, { hash });
      return hash;
    },
    [ensureSourceNetwork, sendTransactionAsync],
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
      if (destination === 'gami' && !gamiTokenOnBase()) {
        setError('Set VITE_GAMI_TOKEN_ADDRESS to route into $GAMI on Base.');
        setPhase('error');
        return;
      }

      setPhase('quoting');
      try {
        const mapped = mapSwapAsset(from);
        const tokenIn =
          mapped === 'OTHER'
            ? resolveTokenIn(sourceChainId, 'USDC', customToken.trim() || undefined)
            : resolveTokenIn(sourceChainId, mapped);
        const tokenOut = resolveTokenOut(destination);
        const tokenOutChainId = GAMI_CHAIN_ID;
        const amountOut = destinationAmountBaseUnits(destination, options.amountUsd);

        const quoteResponse = await getQuote({
          swapper: options.address,
          tokenIn,
          tokenOut,
          amount: amountOut,
          tokenInChainId: sourceChainId,
          tokenOutChainId,
          type: 'EXACT_OUTPUT',
        });

        const amountIn = quotedInputAmount(quoteResponse);
        const out = quotedOutputAmount(quoteResponse) ?? amountOut;
        if (!amountIn) {
          throw new UniswapTradeApiError('Quote missing input amount.');
        }

        const inDecimals =
          mapped === 'OTHER'
            ? 18
            : tokenDecimals(mapped, sourceChainId);

        const approvalAmount = ((BigInt(amountIn) * 105n) / 100n).toString();
        const approval = await checkApproval({
          walletAddress: options.address,
          token: tokenIn,
          amount: approvalAmount,
          chainId: sourceChainId,
        });

        setPendingApproval(approval.approval);
        setQuote(quoteResponse);
        setPreview({
          routing: String(quoteResponse.routing ?? 'CLASSIC'),
          amountIn,
          amountOut: out,
          amountInFormatted: formatUnits(BigInt(amountIn), inDecimals),
          amountOutFormatted: formatUnits(BigInt(out), outDecimals(destination)),
          gasFeeUsd: quoteResponse.quote?.gasFeeUSD,
          bridgeFee: quoteResponse.quote?.bridgeFee,
          estimatedFillTime: quoteResponse.quote?.estimatedFillTime,
          tokenIn,
          tokenOut,
          tokenInChainId: sourceChainId,
          tokenOutChainId,
          destination,
          crossChain: isCrossChain(sourceChainId, tokenOutChainId),
        });
        setPhase('quoted');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to fetch Uniswap quote.';
        setError(message);
        setPhase('error');
      }
    },
    [customToken, destination, options.address, options.amountUsd, sourceChainId],
  );

  const executeSwap = useCallback(async () => {
    if (!options.address || !quote || !preview) {
      setError('Fetch a quote before swapping.');
      setPhase('error');
      return;
    }

    setError(null);
    try {
      if (pendingApproval) {
        setPhase('approving');
        await sendAndWait(pendingApproval, preview.tokenInChainId);
      }

      setPhase('swapping');
      const freshQuote = await getQuote({
        swapper: options.address,
        tokenIn: preview.tokenIn,
        tokenOut: preview.tokenOut,
        amount: preview.amountOut,
        tokenInChainId: preview.tokenInChainId,
        tokenOutChainId: preview.tokenOutChainId,
        type: 'EXACT_OUTPUT',
      });

      const amountIn = quotedInputAmount(freshQuote);
      if (amountIn) {
        const approval = await checkApproval({
          walletAddress: options.address,
          token: preview.tokenIn,
          amount: ((BigInt(amountIn) * 105n) / 100n).toString(),
          chainId: preview.tokenInChainId,
        });
        if (approval.approval) {
          setPhase('approving');
          await sendAndWait(approval.approval, preview.tokenInChainId);
          setPhase('swapping');
        }
      }

      const result = await executeQuote(freshQuote);
      if (result.kind === 'order') {
        setPhase('done');
        options.onComplete?.();
        return;
      }

      setPhase('confirming');
      await sendAndWait(result.response.swap, preview.tokenInChainId);
      setPhase('done');
      options.onComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed.';
      if (!/user rejected|denied|cancel/i.test(message)) {
        setError(message);
      }
      setPhase('error');
    }
  }, [options, pendingApproval, preview, quote, sendAndWait]);

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

  const sourceChainLabel =
    BRIDGE_SOURCE_CHAINS.find((c) => c.chainId === sourceChainId)?.label ?? 'Source';

  return {
    phase,
    error,
    preview,
    pendingApproval,
    customToken,
    setCustomToken,
    sourceChainId,
    setSourceChainId,
    destination,
    setDestination,
    sourceChainLabel,
    gamiConfigured: Boolean(gamiTokenOnBase()),
    baseUsdc: BASE_USDC,
    apiConfigured: uniswapApiConfigured(),
    txHash,
    explorerUrl: txHash ? explorerTxUrl(preview?.tokenInChainId ?? GAMI_CHAIN_ID, txHash) : null,
    clear,
    fetchQuote,
    executeSwap,
    openDeepLinkFallback,
  };
}
