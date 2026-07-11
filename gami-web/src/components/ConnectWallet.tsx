'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="font-mono text-xs border border-white/20 px-3 py-1.5 hover:border-primary transition"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  const connector = connectors[0];
  return (
    <button
      type="button"
      disabled={!connector || isPending}
      onClick={() => connector && connect({ connector })}
      className="font-mono text-xs bg-primary px-3 py-1.5 font-bold uppercase disabled:opacity-50"
    >
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}
