import { getChainId, getContractAddress } from '@/lib/contracts';
import { env } from '@/lib/env';
import { BASE_MAINNET_USDC, isBaseMainnet, openExternalUrl } from '@/lib/payment-gateway';

/**
 * Canonical $GAMI market addresses for the raise campaign.
 * Source of truth: https://github.com/Gami-Protocol/gami-protocol-chain
 * Override with VITE_GAMI_TOKEN_ADDRESS / VITE_GAMI_SOLANA_MINT when deploys update.
 */
export const GAMI_PROTOCOL_CHAIN_REPO = 'https://github.com/Gami-Protocol/gami-protocol-chain';

/** Base mainnet GAMI ERC-20 (chain deploy / Uniswap listing). */
export const DEFAULT_GAMI_EVM_BASE =
  '0xf563A2920e6e0b1dD9Bd749Af98cceD6784D6f66' as const;

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function gamiEvmTokenAddress(): `0x${string}` | null {
  const fromEnv = getContractAddress('GAMI') ?? env.gamiTokenAddress();
  if (fromEnv && fromEnv.startsWith('0x') && fromEnv.length === 42) {
    return fromEnv as `0x${string}`;
  }
  // Prefer mainnet default when running Base mainnet; otherwise require env for testnet.
  if (getChainId() === 8453) return DEFAULT_GAMI_EVM_BASE;
  return null;
}

export function gamiSolanaMint(): string | null {
  const mint = env.gamiSolanaMint()?.trim();
  if (!mint || mint.length < 32) return null;
  return mint;
}

export function uniswapChainSlug(): 'base' | 'base_sepolia' {
  return isBaseMainnet() ? 'base' : 'base_sepolia';
}

/** Swap any EVM crypto → USDC for raise contribution (Uniswap). */
export function buildUniswapRaiseUsdcUrl(input?: {
  wallet?: string;
  amountUsdc?: string;
  fromNative?: boolean;
}): string | null {
  const usdc = isBaseMainnet() ? BASE_MAINNET_USDC : getContractAddress('USDC');
  if (!usdc) return null;
  const params = new URLSearchParams({
    chain: uniswapChainSlug(),
    outputCurrency: usdc,
  });
  if (input?.fromNative !== false) params.set('inputCurrency', 'NATIVE');
  if (input?.wallet) params.set('recipient', input.wallet);
  if (input?.amountUsdc) {
    params.set('exactField', 'output');
    params.set('exactAmount', input.amountUsdc);
  }
  return `https://app.uniswap.org/swap?${params.toString()}`;
}

/** Buy $GAMI on Uniswap (EVM first market for the raise). */
export function buildUniswapBuyGamiUrl(input?: {
  wallet?: string;
  amountUsd?: string;
}): string | null {
  const token = gamiEvmTokenAddress();
  if (!token) return null;
  const params = new URLSearchParams({
    chain: uniswapChainSlug(),
    outputCurrency: token,
    inputCurrency: isBaseMainnet() ? BASE_MAINNET_USDC : 'NATIVE',
  });
  if (input?.wallet) params.set('recipient', input.wallet);
  if (input?.amountUsd) {
    params.set('exactField', 'input');
    params.set('exactAmount', input.amountUsd);
  }
  return `https://app.uniswap.org/swap?${params.toString()}`;
}

export function buildUniswapGamiTokenPageUrl(): string | null {
  const token = gamiEvmTokenAddress();
  if (!token) return null;
  return `https://app.uniswap.org/explore/tokens/${uniswapChainSlug()}/${token}`;
}

/** Buy $GAMI on Jupiter (Solana). */
export function buildJupiterBuyGamiUrl(): string | null {
  const mint = gamiSolanaMint();
  if (!mint) return null;
  return `https://jup.ag/swap/${SOL_MINT}-${mint}`;
}

/** Buy $GAMI on Raydium (Solana). */
export function buildRaydiumBuyGamiUrl(): string | null {
  const mint = gamiSolanaMint();
  if (!mint) return null;
  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint: mint,
  });
  return `https://raydium.io/swap/?${params.toString()}`;
}

export type DexMarketLink = {
  id: 'uniswap' | 'raydium' | 'jupiter';
  label: string;
  network: 'EVM' | 'Solana';
  href: string | null;
  blurb: string;
};

export function raiseDexMarkets(input?: {
  wallet?: string;
  amountUsd?: string;
}): DexMarketLink[] {
  return [
    {
      id: 'uniswap',
      label: 'Uniswap',
      network: 'EVM',
      href: buildUniswapBuyGamiUrl(input),
      blurb: 'Get $GAMI on Base first (EVM)',
    },
    {
      id: 'raydium',
      label: 'Raydium',
      network: 'Solana',
      href: buildRaydiumBuyGamiUrl(),
      blurb: 'Solana spot market',
    },
    {
      id: 'jupiter',
      label: 'Jupiter',
      network: 'Solana',
      href: buildJupiterBuyGamiUrl(),
      blurb: 'Solana aggregator',
    },
  ];
}

export function openDex(href: string | null): void {
  if (!href) return;
  openExternalUrl(href);
}
