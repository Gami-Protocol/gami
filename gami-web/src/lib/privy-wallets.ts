/**
 * Shared Privy wallet UI config: Coinbase + EVM + Solana connectors.
 * Sale settlement stays on Base USDC; Solana wallets are for connect/fund flows.
 */

// 'wallet_connect' (EVM) and 'wallet_connect_qr_solana' cannot both be present —
// Privy expands 'wallet_connect' into 'wallet_connect_qr' internally, which
// collides with 'wallet_connect_qr_solana' over shared WalletConnect session
// state (throws "cannot both be present in walletList" at render time).
// Keeping 'wallet_connect' (broad EVM reach); Solana wallets not explicitly
// listed here (phantom/solflare/backpack) still work via 'detected_solana_wallets'.
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
] as const;

export const PRIVY_WALLET_CHAIN_TYPE = 'ethereum-and-solana' as const;
