import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';

import { getChainId } from '@/lib/contracts';

type ConnectWalletVariant = 'default' | 'light' | 'sale';

const VARIANT_CLASS: Record<ConnectWalletVariant, { connected: string; disconnected: string }> = {
  default: {
    connected: 'border-white/20 px-3 py-2 font-mono text-[10px] font-bold hover:border-primary',
    disconnected: 'bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase',
  },
  light: {
    connected: 'border-2 border-black bg-[#67f5a1] px-3 py-2 font-mono text-[10px] font-bold text-black hover:bg-[#ffeb55]',
    disconnected:
      'border-2 border-black bg-[#7047eb] px-3 py-2 font-mono text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#131118]',
  },
  sale: {
    connected:
      'border-2 border-black bg-[#67f5a1] px-4 py-2.5 font-mono text-xs font-bold text-black hover:bg-[#ffeb55] sm:px-5',
    disconnected:
      'border-2 border-black bg-[#7047eb] px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_#131118] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#131118] sm:px-5',
  },
};

export function ConnectWallet({ light = false, variant }: { light?: boolean; variant?: ConnectWalletVariant }) {
  const resolvedVariant = variant ?? (light ? 'light' : 'default');
  const styles = VARIANT_CLASS[resolvedVariant];

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const targetChainId = getChainId();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const needsSwitch = isConnected && chainId !== targetChainId;

  if (needsSwitch) {
    return (
      <button
        type="button"
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: targetChainId })}
        className={styles.disconnected}
      >
        {isSwitching ? 'Switching…' : 'Switch to Base'}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect wallet"
        className={styles.connected}
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  const connector = connectors.find((c) => c.ready) ?? connectors[0];

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={!connector || isPending}
        onClick={() => connector && connect({ connector })}
        className={`${styles.disconnected} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {error && (
        <span className="max-w-[200px] text-right font-mono text-[9px] text-red-400">
          {error.message.slice(0, 80)}
        </span>
      )}
    </div>
  );
}
