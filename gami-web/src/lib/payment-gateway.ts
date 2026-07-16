import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';

import { getActiveChain, getChainId, getContractAddress } from '@/lib/contracts';
import { env } from '@/lib/env';

/** Canonical Base mainnet stables used for production swap deep-links. */
export const BASE_MAINNET_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const BASE_MAINNET_USDT = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as const;

export type PaymentMethod = 'usdc' | 'usdt' | 'fiat';
export type SwapAsset = 'usdt' | 'eth' | 'other';

export function isBaseMainnet(): boolean {
  return getChainId() === 8453;
}

export function settlementUsdcAddress(): `0x${string}` {
  return getContractAddress('USDC') ?? BASE_MAINNET_USDC;
}

export function caip2Chain(): `eip155:${number}` {
  return `eip155:${getChainId()}`;
}

/** Fill `{wallet}`, `{address}`, `{amount}`, `{usdc}` placeholders in configured URLs. */
export function interpolatePaymentUrl(
  template: string,
  vars: { wallet?: string; amount?: string; usdc?: string },
): string {
  return template
    .split('{wallet}')
    .join(vars.wallet ?? '')
    .split('{address}')
    .join(vars.wallet ?? '')
    .split('{amount}')
    .join(vars.amount ?? '')
    .split('{usdc}')
    .join(vars.usdc ?? settlementUsdcAddress());
}

export function buildUniswapSwapUrl(input: {
  from: SwapAsset;
  wallet?: string;
  amountUsdc?: string;
}): string {
  const usdc = isBaseMainnet() ? BASE_MAINNET_USDC : settlementUsdcAddress();
  const chain = isBaseMainnet() ? 'base' : 'base_sepolia';
  const params = new URLSearchParams({
    chain,
    outputCurrency: usdc,
  });

  if (input.from === 'usdt') {
    params.set('inputCurrency', isBaseMainnet() ? BASE_MAINNET_USDT : 'NATIVE');
  } else if (input.from === 'eth') {
    params.set('inputCurrency', 'NATIVE');
  }
  // `other` leaves input unset so the user can pick any token.

  if (input.wallet) params.set('recipient', input.wallet);
  if (input.amountUsdc) {
    params.set('exactField', 'output');
    params.set('exactAmount', input.amountUsdc);
  }

  return `https://app.uniswap.org/swap?${params.toString()}`;
}

export function buildAerodromeSwapUrl(input: {
  from: SwapAsset;
  amountUsdc?: string;
}): string | null {
  if (!isBaseMainnet()) return null;
  const params = new URLSearchParams({
    chain: '8453',
    to: BASE_MAINNET_USDC,
  });
  if (input.from === 'usdt') params.set('from', BASE_MAINNET_USDT);
  if (input.from === 'eth') params.set('from', 'eth');
  if (input.amountUsdc) params.set('amount', input.amountUsdc);
  return `https://aerodrome.finance/swap?${params.toString()}`;
}

export function resolveUsdtSwapUrl(wallet?: string, amountUsdc?: string): string {
  const configured = env.usdtSwapUrl();
  if (configured) {
    return interpolatePaymentUrl(configured, {
      wallet,
      amount: amountUsdc,
      usdc: settlementUsdcAddress(),
    });
  }
  return (
    buildAerodromeSwapUrl({ from: 'usdt', amountUsdc }) ??
    buildUniswapSwapUrl({
      from: 'usdt',
      wallet,
      amountUsdc,
    })
  );
}

export function resolveCryptoSwapUrl(
  from: SwapAsset,
  wallet?: string,
  amountUsdc?: string,
): string {
  if (from === 'usdt') return resolveUsdtSwapUrl(wallet, amountUsdc);
  return (
    buildAerodromeSwapUrl({ from, amountUsdc }) ??
    buildUniswapSwapUrl({ from, wallet, amountUsdc })
  );
}

export function rampConfigured(): boolean {
  return Boolean(env.rampHostApiKey());
}

export function coinbaseOnrampAvailable(): boolean {
  return Boolean(env.privyAppId());
}

export function fiatGatewayAvailable(): boolean {
  return rampConfigured() || coinbaseOnrampAvailable() || Boolean(env.fiatOnrampUrl());
}

export function swapGatewayAvailable(): boolean {
  return true;
}

type RampLaunchOptions = {
  wallet: string;
  amountUsd?: string;
};

/** Launch Ramp Instant for card / Apple Pay / Google Pay → USDC on Base. */
export function launchRamp(options: RampLaunchOptions): void {
  const hostApiKey = env.rampHostApiKey();
  if (!hostApiKey) {
    throw new Error('Ramp host API key is not configured (VITE_RAMP_HOST_API_KEY).');
  }

  const config: ConstructorParameters<typeof RampInstantSDK>[0] = {
    hostAppName: 'Gami Protocol',
    hostLogoUrl: `${window.location.origin}/gami-token.svg`,
    hostApiKey,
    userAddress: options.wallet,
    defaultFlow: 'ONRAMP',
    enabledFlows: ['ONRAMP'],
    swapAsset: 'BASE_USDC',
    defaultAsset: 'BASE_USDC',
    fiatCurrency: 'USD',
    fiatValue: options.amountUsd && Number(options.amountUsd) > 0 ? options.amountUsd : undefined,
    variant: 'auto',
    ...(env.rampEnvironment() === 'demo'
      ? { url: 'https://app.demo.rampnetwork.com' }
      : {}),
  };

  new RampInstantSDK(config).show();
}

export function openExternalUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function paymentChainLabel(): string {
  return getActiveChain().name;
}
