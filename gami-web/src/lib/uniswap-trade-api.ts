import { getChainId, getContractAddress } from '@/lib/contracts';
import { env } from '@/lib/env';
import {
  BASE_USDC,
  CHAIN_TOKENS,
  GAMI_CHAIN_ID,
  isCrossChain,
  NATIVE_ETH,
  type BridgeAssetSymbol,
  type BridgeSourceChainId,
} from '@/lib/uniswap-chains';

export { NATIVE_ETH };

export const UNISWAP_TRADE_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';

export type UniswapTx = {
  to: `0x${string}`;
  from?: `0x${string}`;
  data: `0x${string}`;
  value?: string;
  chainId?: number;
  gasLimit?: string;
};

export type CheckApprovalResponse = {
  approval: UniswapTx | null;
  requestId?: string;
};

export type QuoteResponse = {
  requestId?: string;
  routing?: string;
  quote?: {
    input?: { token?: string; amount?: string };
    output?: { token?: string; amount?: string };
    gasFeeUSD?: string;
    gasUseEstimate?: string;
    slippage?: number;
    bridgeFee?: string;
    estimatedFillTime?: string;
    quoteId?: string;
    orderInfo?: {
      outputs?: Array<{ token?: string; startAmount?: string; endAmount?: string }>;
      input?: { token?: string; startAmount?: string; endAmount?: string };
    };
  };
  permitData?: unknown;
  permitTransaction?: unknown;
  [key: string]: unknown;
};

export type SwapResponse = {
  swap: UniswapTx;
  gasFee?: string;
  requestId?: string;
};

export type TradeDestination = 'usdc' | 'gami';

export class UniswapTradeApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = 'UniswapTradeApiError';
  }
}

export function uniswapApiConfigured(): boolean {
  return Boolean(env.uniswapApiKey());
}

export function gamiTokenOnBase(): `0x${string}` | null {
  return getContractAddress('GAMI');
}

export function resolveTokenIn(
  chainId: BridgeSourceChainId,
  asset: BridgeAssetSymbol,
  customToken?: string,
): `0x${string}` {
  if (customToken) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(customToken)) {
      throw new Error('Enter a valid ERC-20 token address.');
    }
    return customToken as `0x${string}`;
  }
  const token = CHAIN_TOKENS[chainId]?.[asset];
  if (!token) {
    throw new Error(`${asset} is not configured on chain ${chainId}.`);
  }
  return token;
}

export function resolveTokenOut(destination: TradeDestination): `0x${string}` {
  if (destination === 'gami') {
    const gami = gamiTokenOnBase();
    if (!gami) {
      throw new Error('Set VITE_GAMI_TOKEN_ADDRESS to swap into $GAMI on Base.');
    }
    return gami;
  }
  return BASE_USDC;
}

function headers(): HeadersInit {
  const apiKey = env.uniswapApiKey();
  if (!apiKey) {
    throw new UniswapTradeApiError(
      'Uniswap Trading API key missing. Set VITE_UNISWAP_API_KEY.',
    );
  }
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-universal-router-version': '2.0',
    // Proxy-approval flow: ERC-20 approve tx instead of Permit2 signatures.
    'x-permit2-disabled': 'true',
  };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const base = env.uniswapApiBase() || UNISWAP_TRADE_API_BASE;
  const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const detail =
      payload && typeof payload === 'object'
        ? ((payload as { detail?: string; message?: string; error?: string }).detail ??
          (payload as { message?: string }).message ??
          (payload as { error?: string }).error)
        : undefined;
    throw new UniswapTradeApiError(
      detail ? String(detail) : `Uniswap API ${path} failed (${res.status})`,
      res.status,
      payload,
    );
  }

  return payload as T;
}

/** Step 1 — Permit2/proxy approval check on the source chain. */
export async function checkApproval(input: {
  walletAddress: string;
  token: string;
  amount: string;
  chainId: number;
}): Promise<CheckApprovalResponse> {
  if (input.token.toLowerCase() === NATIVE_ETH.toLowerCase()) {
    return { approval: null };
  }

  return postJson<CheckApprovalResponse>('/check_approval', {
    walletAddress: input.walletAddress,
    token: input.token,
    amount: input.amount,
    chainId: input.chainId,
    includeGasInfo: true,
    // Help the API attach destination context for bridges.
    tokenOut: BASE_USDC,
    tokenOutChainId: GAMI_CHAIN_ID,
  });
}

/**
 * Step 2 — Aggregator quote.
 * Same-chain: V2/V3/V4. Cross-chain into Base: omit protocols so BRIDGE routes are eligible.
 */
export async function getQuote(input: {
  swapper: string;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  tokenInChainId: number;
  tokenOutChainId: number;
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  slippageTolerance?: number;
}): Promise<QuoteResponse> {
  const crossChain = isCrossChain(input.tokenInChainId, input.tokenOutChainId);
  const body: Record<string, unknown> = {
    type: input.type ?? 'EXACT_OUTPUT',
    amount: input.amount,
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    tokenInChainId: input.tokenInChainId,
    tokenOutChainId: input.tokenOutChainId,
    swapper: input.swapper,
    slippageTolerance: input.slippageTolerance ?? 0.5,
    routingPreference: 'BEST_PRICE',
  };

  // For same-chain swaps prefer classic AMM. For bridges, leave protocols unset
  // so the aggregator can return BRIDGE / chained routes.
  if (!crossChain) {
    body.protocols = ['V4', 'V3', 'V2'];
  }

  return postJson<QuoteResponse>('/quote', body);
}

/** Strip null permit fields and prepare /swap body from a quote response. */
export function prepareSwapRequest(quoteResponse: QuoteResponse): Record<string, unknown> {
  const { permitData, permitTransaction, signature: _sig, ...clean } = quoteResponse;
  const body: Record<string, unknown> = { ...clean };

  const routing = String(quoteResponse.routing ?? '');
  const isUniswapX =
    routing === 'DUTCH_V2' || routing === 'DUTCH_V3' || routing === 'PRIORITY';

  if (!isUniswapX && permitData && typeof permitData === 'object') {
    body.permitData = permitData;
  }
  if (!isUniswapX && permitTransaction && typeof permitTransaction === 'object') {
    body.permitTransaction = permitTransaction;
  }

  return body;
}

function isUniswapXRouting(routing: string): boolean {
  return routing === 'DUTCH_V2' || routing === 'DUTCH_V3' || routing === 'PRIORITY';
}

/**
 * Step 3 — Execute quote:
 * - UniswapX → POST /order (gasless filler)
 * - Classic / Bridge / Wrap → POST /swap (integrator submits on-chain)
 */
export async function executeQuote(quoteResponse: QuoteResponse): Promise<
  | { kind: 'swap'; response: SwapResponse }
  | { kind: 'order'; response: unknown; note: string }
> {
  const routing = String(quoteResponse.routing ?? 'CLASSIC');

  if (isUniswapXRouting(routing)) {
    const encodedOrder =
      (quoteResponse.quote as { encodedOrder?: string } | undefined)?.encodedOrder ??
      (quoteResponse as { encodedOrder?: string }).encodedOrder;
    const signature = (quoteResponse as { signature?: string }).signature;
    if (!encodedOrder || !signature) {
      throw new UniswapTradeApiError(
        'UniswapX quote requires a signed order. Prefer classic/bridge routes for in-app funding.',
      );
    }
    const response = await postJson('/order', {
      encodedOrder,
      signature,
      orderType: routing === 'PRIORITY' ? 'Priority' : routing === 'DUTCH_V3' ? 'Dutch_V3' : 'Dutch_V2',
      chainId: getChainId(),
    });
    return {
      kind: 'order',
      response,
      note: 'UniswapX order submitted — a market maker will fill it gaslessly.',
    };
  }

  const response = await postJson<SwapResponse>('/swap', prepareSwapRequest(quoteResponse));
  if (!response.swap?.data || response.swap.data === '0x') {
    throw new UniswapTradeApiError('Empty swap calldata — quote may have expired. Try again.');
  }
  return { kind: 'swap', response };
}

/** @deprecated Use executeQuote — kept for callers that only want classic /swap. */
export async function createSwap(quoteResponse: QuoteResponse): Promise<SwapResponse> {
  const result = await executeQuote(quoteResponse);
  if (result.kind !== 'swap') {
    throw new UniswapTradeApiError(result.note);
  }
  return result.response;
}

export function quotedOutputAmount(quote: QuoteResponse): string | null {
  const classic = quote.quote?.output?.amount;
  if (classic) return classic;
  const uniswapX = quote.quote?.orderInfo?.outputs?.[0]?.startAmount;
  return uniswapX ?? null;
}

export function quotedInputAmount(quote: QuoteResponse): string | null {
  const classic = quote.quote?.input?.amount;
  if (classic) return classic;
  const uniswapX = quote.quote?.orderInfo?.input?.startAmount;
  return uniswapX ?? null;
}

export function usdcAmountToBaseUnits(amountUsd: string): string {
  const n = Number(amountUsd);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('Enter a valid USDC amount for the swap.');
  }
  return String(Math.round(n * 1e6));
}

/** Exact-output target: USDC on Base, or GAMI (18 decimals) when destination is gami. */
export function destinationAmountBaseUnits(
  destination: TradeDestination,
  amountUsd: string,
  gamiPreviewAmount?: string,
): string {
  if (destination === 'usdc') return usdcAmountToBaseUnits(amountUsd);
  if (gamiPreviewAmount && /^[0-9]+$/.test(gamiPreviewAmount)) return gamiPreviewAmount;
  // Sale price $0.012 → convert USD intent into GAMI base units (18 decimals).
  const usd = Number(amountUsd);
  if (!Number.isFinite(usd) || usd <= 0) {
    throw new Error('Enter a valid amount for the $GAMI swap.');
  }
  const tokens = usd / 0.012;
  const whole = Math.floor(tokens);
  const frac = Math.round((tokens - whole) * 1e6);
  return (BigInt(whole) * 10n ** 18n + BigInt(frac) * 10n ** 12n).toString();
}
