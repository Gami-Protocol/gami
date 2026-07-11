'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const WALLET_DEEP_LINK = 'gami://onboarding/welcome';
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '#';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? '#';
const TESTFLIGHT_URL = process.env.NEXT_PUBLIC_TESTFLIGHT_URL ?? '#';

function WalletContent() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const deepLink = ref ? `gami://ref/${ref}` : WALLET_DEEP_LINK;
  const webAppUrl = `https://app.bilt.me/project/73c82cd4-2f64-41e0-a0f2-3c4fa607c6bb/preview${ref ? `?ref=${ref}` : ''}`;

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="font-display text-4xl font-bold">Get Gami Wallet</h1>
      <p className="mt-4 text-muted">
        Your wallet, but make it FUN. Stack XP, complete quests, and claim your $GAMI at TGE.
      </p>

      {ref && (
        <div className="sticker-shadow mt-6 border-2 border-primary bg-surface p-4">
          <p className="font-mono text-xs text-muted">REFERRAL CODE</p>
          <p className="font-mono text-xl font-bold text-primary">{ref}</p>
          <p className="mt-2 text-sm text-muted">+50 XP bonus on first open</p>
        </div>
      )}

      {/* QR-style download card */}
      <div className="sticker-shadow mx-auto mt-10 max-w-xs border-2 border-white/10 bg-white p-8 text-black">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
          G
        </div>
        <p className="mt-4 font-display text-lg font-bold">Gami Wallet</p>
        <p className="text-sm text-gray-500">Scan to download</p>
        <div className="mx-auto mt-4 h-32 w-32 bg-gray-100 flex items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(webAppUrl)}`}
            alt="Download QR"
            width={128}
            height={128}
          />
        </div>
      </div>

      <p className="mt-4 font-mono text-xs text-muted">Scan this code to open Gami Wallet</p>

      <div className="mt-8 space-y-3">
        <a
          href={deepLink}
          className="sticker-shadow block bg-primary py-4 font-display font-bold uppercase"
        >
          Open in App
        </a>
        <a
          href={TESTFLIGHT_URL}
          className="block border-2 border-white/20 py-3 font-display font-bold uppercase hover:border-primary"
        >
          TestFlight (iOS)
        </a>
        <a
          href={PLAY_STORE_URL}
          className="block border-2 border-white/20 py-3 font-display font-bold uppercase hover:border-primary"
        >
          Google Play (Android)
        </a>
        <a
          href={webAppUrl}
          className="block border-2 border-white/20 py-3 font-mono text-sm hover:border-primary"
        >
          Try Web Preview
        </a>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Loading...</div>}>
      <WalletContent />
    </Suspense>
  );
}
