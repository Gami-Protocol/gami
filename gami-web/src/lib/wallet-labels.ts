export type LabeledWallet = {
  address: string;
  walletClientType?: string | null;
  connectorType?: string | null;
  meta?: { name?: string; icon?: string | null };
};

export function isPrivyEmbeddedWallet(wallet: LabeledWallet): boolean {
  return wallet.walletClientType === 'privy';
}

export function walletTypeLabel(wallet: LabeledWallet): string {
  if (isPrivyEmbeddedWallet(wallet)) return 'Privy email wallet';

  const client = (wallet.walletClientType ?? '').toLowerCase();
  const metaName = wallet.meta?.name?.trim();

  if (metaName) return metaName;
  if (client.includes('metamask')) return 'MetaMask';
  if (client.includes('coinbase')) return 'Coinbase Wallet';
  if (client.includes('rainbow')) return 'Rainbow';
  if (client.includes('wallet_connect') || client.includes('walletconnect')) return 'WalletConnect';
  if (client.includes('base_account') || client.includes('base')) return 'Base Account';
  if (client) return client.replace(/_/g, ' ');
  return 'External wallet';
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const ACTIVE_WALLET_KEY = 'gami.activeWallet';

export function readPreferredWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_WALLET_KEY);
  } catch {
    return null;
  }
}

export function writePreferredWalletAddress(address: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_WALLET_KEY, address.toLowerCase());
  } catch {
    // ignore quota / private mode
  }
}
