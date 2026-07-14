import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { env } from '@/lib/env';

type ConnectWalletProps = {
  light?: boolean;
  className?: string;
};

function buttonClass(light: boolean, className: string): string {
  return `${className} px-3 py-2 font-mono text-[10px] font-bold uppercase disabled:cursor-wait disabled:opacity-50 ${
    light
      ? 'border-2 border-black bg-[#7047eb] text-white shadow-[3px_3px_0_#131118]'
      : 'bg-primary'
  }`;
}

function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function PrivyConnectWallet({ light = false, className = '' }: ConnectWalletProps) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const privyAddress = wallets[0]?.address;
  const displayAddress = address ?? privyAddress;

  if (authenticated) {
    const linking = !isConnected || !displayAddress;
    return (
      <button
        type="button"
        onClick={() => void logout()}
        title="Sign out and disconnect wallet"
        className={`border-2 px-3 py-2 font-mono text-[10px] font-bold transition ${
          light
            ? 'border-black bg-[#67f5a1] text-black hover:bg-[#ffeb55]'
            : 'border-white/20 hover:border-primary'
        } ${className}`}
      >
        {linking
          ? 'Linking wallet…'
          : displayAddress
            ? shorten(displayAddress)
            : 'PRIVY SIGNED IN'}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() =>
        login({
          loginMethods: ['email', 'wallet'],
          walletChainType: 'ethereum-only',
        })
      }
      className={buttonClass(light, className)}
    >
      {ready ? 'Sign in / Connect wallet' : 'Loading Privy…'}
    </button>
  );
}

function LegacyConnectWallet({ light = false, className = '' }: ConnectWalletProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect wallet"
        className={`border-2 px-3 py-2 font-mono text-[10px] font-bold transition ${
          light
            ? 'border-black bg-[#67f5a1] text-black hover:bg-[#ffeb55]'
            : 'border-white/20 hover:border-primary'
        } ${className}`}
      >
        {shorten(address)}
      </button>
    );
  }

  const connector = connectors[0];
  return (
    <button
      type="button"
      disabled={!connector || isPending}
      onClick={() => connector && connect({ connector })}
      className={buttonClass(light, className)}
    >
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}

export function ConnectWallet(props: ConnectWalletProps) {
  return env.privyAppId() ? <PrivyConnectWallet {...props} /> : <LegacyConnectWallet {...props} />;
}
