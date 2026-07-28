/** Native ETH sentinel used by the Uniswap Trading API. */
export const NATIVE_ETH = '0x0000000000000000000000000000000000000000' as const;

/** Destination chain for Gami Protocol settlement (Base). */
export const GAMI_CHAIN_ID = 8453;

export type BridgeSourceChainId = 1 | 10 | 137 | 42161 | 8453;

export type BridgeAssetSymbol = 'ETH' | 'USDC' | 'USDT';

export type BridgeSourceOption = {
  chainId: BridgeSourceChainId;
  label: string;
  shortLabel: string;
};

export const BRIDGE_SOURCE_CHAINS: BridgeSourceOption[] = [
  { chainId: 1, label: 'Ethereum', shortLabel: 'ETH' },
  { chainId: 42161, label: 'Arbitrum', shortLabel: 'ARB' },
  { chainId: 10, label: 'Optimism', shortLabel: 'OP' },
  { chainId: 137, label: 'Polygon', shortLabel: 'POL' },
  { chainId: 8453, label: 'Base (same-chain)', shortLabel: 'BASE' },
];

/** Canonical tokens used for bridge/swap quotes into Base USDC / GAMI. */
export const CHAIN_TOKENS: Record<
  BridgeSourceChainId,
  Partial<Record<BridgeAssetSymbol, `0x${string}`>>
> = {
  1: {
    ETH: NATIVE_ETH,
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  10: {
    ETH: NATIVE_ETH,
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
  137: {
    ETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  42161: {
    ETH: NATIVE_ETH,
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  8453: {
    ETH: NATIVE_ETH,
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  },
};

export const BASE_USDC = CHAIN_TOKENS[8453].USDC as `0x${string}`;

export function tokenDecimals(symbol: BridgeAssetSymbol, chainId: BridgeSourceChainId): number {
  if (symbol === 'ETH' && chainId !== 137) return 18;
  if (symbol === 'ETH' && chainId === 137) return 18; // WETH
  return 6; // USDC / USDT
}

export function explorerTxUrl(chainId: number, hash: string): string {
  switch (chainId) {
    case 1:
      return `https://etherscan.io/tx/${hash}`;
    case 10:
      return `https://optimistic.etherscan.io/tx/${hash}`;
    case 137:
      return `https://polygonscan.com/tx/${hash}`;
    case 42161:
      return `https://arbiscan.io/tx/${hash}`;
    case 8453:
      return `https://basescan.org/tx/${hash}`;
    case 84532:
      return `https://sepolia.basescan.org/tx/${hash}`;
    default:
      return `https://basescan.org/tx/${hash}`;
  }
}

export function isCrossChain(tokenInChainId: number, tokenOutChainId: number): boolean {
  return tokenInChainId !== tokenOutChainId;
}
