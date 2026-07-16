import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { env } from '@/lib/env';
import {
  isPrivyEmbeddedWallet,
  shortenAddress,
  walletTypeLabel,
  writePreferredWalletAddress,
} from '@/lib/wallet-labels';

type ConnectWalletProps = {
  light?: boolean;
  className?: string;
};

const EXTERNAL_WALLET_LIST = [
  'detected_ethereum_wallets',
  'metamask',
  'coinbase_wallet',
  'base_account',
  'rainbow',
  'wallet_connect',
] as const;

function buttonClass(light: boolean, className: string): string {
  return `${className} px-3 py-2 font-mono text-[10px] font-bold uppercase disabled:cursor-wait disabled:opacity-50 ${
    light
      ? 'border-2 border-black bg-[#7047eb] text-white shadow-[3px_3px_0_#131118]'
      : 'bg-primary'
  }`;
}

function PrivyConnectWallet({ light = false, className = '' }: ConnectWalletProps) {
  const { ready, authenticated, login, logout, linkWallet } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { address, isConnected } = useAccount();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const embeddedWallet = useMemo(
    () => wallets.find((wallet) => wallet.walletClientType === 'privy'),
    [wallets],
  );
  const externalWallets = useMemo(
    () => wallets.filter((wallet) => wallet.walletClientType !== 'privy'),
    [wallets],
  );

  const activeWallet = useMemo(() => {
    if (address) {
      return wallets.find((wallet) => wallet.address.toLowerCase() === address.toLowerCase());
    }
    return embeddedWallet ?? wallets[0];
  }, [address, embeddedWallet, wallets]);

  const displayAddress = (address ?? activeWallet?.address) as string | undefined;
  const activeIsEmbedded = Boolean(activeWallet && isPrivyEmbeddedWallet(activeWallet));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function activateWallet(wallet: (typeof wallets)[number]) {
    setSwitching(wallet.address);
    try {
      await setActiveWallet(wallet);
      writePreferredWalletAddress(wallet.address);
      setOpen(false);
    } finally {
      setSwitching(null);
    }
  }

  if (authenticated) {
    const linking = !isConnected || !displayAddress;
    const menuBg = light ? 'bg-white text-black border-black' : 'bg-[#15121f] text-white border-white/20';
    const rowIdle = light ? 'hover:bg-[#f4f1f8]' : 'hover:bg-white/10';
    const rowActive = light ? 'bg-[#ffeb55]' : 'bg-primary/30';

    return (
      <div ref={rootRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          title="Manage wallets"
          aria-expanded={open}
          aria-haspopup="menu"
          className={`flex w-full items-center justify-between gap-2 border-2 px-3 py-2 font-mono text-[10px] font-bold transition ${
            light
              ? 'border-black bg-[#67f5a1] text-black hover:bg-[#ffeb55]'
              : 'border-white/20 hover:border-primary'
          }`}
        >
          <span className="truncate">
            {linking
              ? 'Linking wallet…'
              : displayAddress
                ? `${activeIsEmbedded ? 'Privy · ' : ''}${shortenAddress(displayAddress)}`
                : 'PRIVY SIGNED IN'}
          </span>
          <span aria-hidden>{open ? '▴' : '▾'}</span>
        </button>

        {open && (
          <div
            role="menu"
            className={`absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] border-2 p-2 shadow-[6px_6px_0_#131118] ${menuBg}`}
          >
            <p className="px-2 pb-2 font-mono text-[9px] uppercase opacity-60">Active wallet</p>
            {activeWallet ? (
              <div className={`mb-2 border px-3 py-2 ${light ? 'border-black/20' : 'border-white/15'}`}>
                <p className="font-mono text-[10px] font-bold">{walletTypeLabel(activeWallet)}</p>
                <p className="mt-1 font-mono text-[10px] opacity-70">
                  {shortenAddress(activeWallet.address)}
                </p>
              </div>
            ) : (
              <p className="mb-2 px-2 font-mono text-[10px] opacity-70">No active wallet yet.</p>
            )}

            {embeddedWallet && (
              <>
                <p className="px-2 pb-1 pt-1 font-mono text-[9px] uppercase opacity-60">
                  Privy email wallet
                </p>
                <button
                  type="button"
                  role="menuitem"
                  disabled={switching === embeddedWallet.address}
                  onClick={() => void activateWallet(embeddedWallet)}
                  className={`mb-1 flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left font-mono text-[10px] ${
                    activeWallet?.address.toLowerCase() === embeddedWallet.address.toLowerCase()
                      ? rowActive
                      : rowIdle
                  }`}
                >
                  <span className="font-bold">
                    {switching === embeddedWallet.address ? 'Switching…' : 'Use Privy email wallet'}
                  </span>
                  <span className="opacity-70">{shortenAddress(embeddedWallet.address)}</span>
                </button>
              </>
            )}

            <p className="px-2 pb-1 pt-2 font-mono text-[9px] uppercase opacity-60">
              Other wallets
            </p>
            {externalWallets.length === 0 ? (
              <p className="mb-2 px-2 font-mono text-[10px] opacity-70">
                No external wallets linked yet.
              </p>
            ) : (
              externalWallets.map((wallet) => {
                const active =
                  activeWallet?.address.toLowerCase() === wallet.address.toLowerCase();
                return (
                  <button
                    key={wallet.address}
                    type="button"
                    role="menuitem"
                    disabled={switching === wallet.address}
                    onClick={() => void activateWallet(wallet)}
                    className={`mb-1 flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left font-mono text-[10px] ${
                      active ? rowActive : rowIdle
                    }`}
                  >
                    <span className="font-bold">
                      {switching === wallet.address ? 'Switching…' : walletTypeLabel(wallet)}
                    </span>
                    <span className="opacity-70">{shortenAddress(wallet.address)}</span>
                  </button>
                );
              })
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                linkWallet({
                  walletChainType: 'ethereum-only',
                  walletList: [...EXTERNAL_WALLET_LIST],
                });
              }}
              className={`mt-1 w-full px-3 py-2 text-left font-mono text-[10px] font-bold uppercase ${rowIdle}`}
            >
              Connect another wallet
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
              className={`mt-1 w-full px-3 py-2 text-left font-mono text-[10px] font-bold uppercase ${
                light ? 'text-[#a13b3b] hover:bg-[#fff4f4]' : 'text-red-300 hover:bg-white/10'
              }`}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
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
        {shortenAddress(address)}
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
