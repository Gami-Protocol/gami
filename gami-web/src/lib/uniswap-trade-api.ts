import { getChainId } from '@/lib/contracts';
import { env } from '@/lib/env';
import {
  BASE_MAINNET_USDC,
  BASE_MAINNET_USDT,
  isBaseMainnet,
  settlementUsdcAddress,
  type SwapAsset,
} from '@/lib/payment-gateway';

/** Native ETH sentinel used by the Uniswap Trading API. */
export const NATIVE_ETH = '0x0000000000000000000000000000000000000000' as const;

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

export function tokenInForSwapAsset(from: SwapAsset, customToken?: string): `0x${string}` {
  if (from === 'eth') return NATIVE_ETH;
  if (from === 'usdt') {
    if (!isBaseMainnet()) {
      throw new Error('USDT→USDC via Uniswap API is available on Base mainnet. Switch network or use the deep-link fallback.');
    }
    return BASE_MAINNET_USDT;
  }
  if (!customToken || !/^0x[a-fA-F0-9]{40}$/.test(customToken)) {
    throw new Error('Enter a valid ERC-20 token address to swap.');
  }
  return customToken as `0x${string}`;
}

export function tokenOutUsdc(): `0x${string}` {
  return isBaseMainnet() ? BASE_MAINNET_USDC : settlementUsdcAddress();
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

/** Step 1 — Permit2/proxy approval check. */
export async function checkApproval(input: {
  walletAddress: string;
  token: string;
  amount: string;
  chainId?: number;
}): Promise<CheckApprovalResponse> {
  // Native ETH never needs ERC-20 approval.
  if (input.token.toLowerCase() === NATIVE_ETH.toLowerCase()) {
    return { approval: null };
  }

  return postJson<CheckApprovalResponse>('/check_approval', {
    walletAddress: input.walletAddress,
    token: input.token,
    amount: input.amount,
    chainId: input.chainId ?? getChainId(),
    includeGasInfo: true,
  });
}

/** Step 2 — Aggregator quote (classic V2/V3/V4 routes). */
export async function getQuote(input: {
  swapper: string;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  chainId?: number;
  slippageTolerance?: number;
}): Promise<QuoteResponse> {
  const chainId = input.chainId ?? getChainId();
  return postJson<QuoteResponse>('/quote', {
    type: input.type ?? 'EXACT_OUTPUT',
    amount: input.amount,
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    tokenInChainId: chainId,
    tokenOutChainId: chainId,
    swapper: input.swapper,
    slippageTolerance: input.slippageTolerance ?? 0.5,
    protocols: ['V4', 'V3', 'V2'],
    routingPreference: 'BEST_PRICE',
  });
}

/** Strip null permit fields and prepare /swap body from a quote response. */
export function prepareSwapRequest(quoteResponse: QuoteResponse): Record<string, unknown> {
  const { permitData, permitTransaction, signature: _sig, ...clean } = quoteResponse;
  const body: Record<string, unknown> = { ...clean };

  const routing = String(quoteResponse.routing ?? '');
  const isUniswapX =
    routing === 'DUTCH_V2' || routing === 'DUTCH_V3' || routing === 'PRIORITY';

  // Proxy-approval / classic path: never send null permit fields.
  if (!isUniswapX && permitData && typeof permitData === 'object') {
    body.permitData = permitData;
  }
  if (!isUniswapX && permitTransaction && typeof permitTransaction === 'object') {
    body.permitTransaction = permitTransaction;
  }

  return body;
}

/** Step 3a — Classic/bridge/wrap swap calldata (integrator submits on-chain). */
export async function createSwap(quoteResponse: QuoteResponse): Promise<SwapResponse> {
  const routing = String(quoteResponse.routing ?? 'CLASSIC');
  if (routing === 'DUTCH_V2' || routing === 'DUTCH_V3' || routing === 'PRIORITY') {
    throw new UniswapTradeApiError(
      'UniswapX quote returned. Re-quote with classic AMM protocols or submit via /order.',
    );
  }

  const response = await postJson<SwapResponse>('/swap', prepareSwapRequest(quoteResponse));
  if (!response.swap?.data || response.swap.data === '0x') {
    throw new UniswapTradeApiError('Empty swap calldata — quote may have expired. Try again.');
  }
  return response;
}

/** Step 3b — UniswapX gasless order submission (filler writes to chain). */
export async function submitOrder(input: {
  encodedOrder: string;
  orderType?: string;
  signature: string;
  chainId?: number;
}): Promise<unknown> {
  return postJson('/order', {
    encodedOrder: input.encodedOrder,
    orderType: input.orderType ?? 'Dutch_V2',
    signature: input.signature,
    chainId: input.chainId ?? getChainId(),
  });
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
