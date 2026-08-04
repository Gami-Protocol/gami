/**
 * Shared Privy wallet UI config: Coinbase + EVM + Solana connectors.
 * Sale settlement stays on Base USDC; Solana wallets are for connect/fund flows.
 */

export const PRIVY_WALLET_LIST = [
  'detected_ethereum_wallets',
  'detected_solana_wallets',
  'coinbase_wallet',
  'metamask',
  'base_account',
  'rainbow',
  'phantom',
  'solflare',
  'backpack',
  'wallet_connect',
  'wallet_connect_qr_solana',
] as const;

export const PRIVY_WALLET_CHAIN_TYPE = 'ethereum-and-solana' as const;
