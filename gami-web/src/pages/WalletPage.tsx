import { useSearchParams } from 'react-router-dom';

import { GamiLogo } from '@/components/gami/GamiLogo';
import { env } from '@/lib/env';

const WALLET_DEEP_LINK = 'gami://onboarding/welcome';
const APP_STORE_URL = env.appStoreUrl() ?? '#';
const PLAY_STORE_URL = env.playStoreUrl() ?? '#';
const TESTFLIGHT_URL = env.testflightUrl() ?? '#';

export function WalletPage() {
  const [params] = useSearchParams();
  const ref = params.get('ref');
  const deepLink = ref ? `gami://ref/${ref}` : WALLET_DEEP_LINK;
  const webAppUrl = `https://app.bilt.me/project/73c82cd4-2f64-41e0-a0f2-3c4fa607c6bb/preview${ref ? `?ref=${ref}` : ''}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=H&qzone=2&color=15121F&bgcolor=FFFFFF&data=${encodeURIComponent(webAppUrl)}`;

  return (
    <div className="mx-auto max-w-lg px-6 pb-20 pt-36 text-center">
      <div className="mb-5 inline-flex items-center gap-2 border border-primary/60 bg-primary/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gami-accent">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-glow" />
        The wallet that plays
      </div>
      <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
        YOUR GAMI.
        <br />
        <span className="text-gami-accent">YOUR WALLET.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-muted sm:text-base">
        Stack XP, complete quests, and keep your digital world in one place.
      </p>

      {ref && (
        <div className="sticker-shadow mt-6 border-2 border-primary bg-surface p-4">
          <p className="font-mono text-xs text-muted">REFERRAL CODE</p>
          <p className="font-mono text-xl font-bold text-primary">{ref}</p>
          <p className="mt-2 text-sm text-muted">+50 XP bonus on first open</p>
        </div>
      )}

      <div className="sticker-shadow relative mx-auto mt-10 max-w-sm border-2 border-primary bg-surface p-3 text-left">
        <div
          className="pointer-events-none absolute -right-4 -top-5 h-20 w-20 rotate-12 border-2 border-primary/30"
          aria-hidden="true"
        />

        <div className="gami-gradient relative overflow-hidden border-2 border-black px-5 py-4">
          <div
            className="pointer-events-none absolute -right-7 -top-12 h-32 w-32 rotate-45 border-[18px] border-white/10"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="neo-border flex h-11 w-11 items-center justify-center bg-black/20">
                <GamiLogo className="h-7 w-7" />
              </div>
              <div>
                <p className="font-display text-xl font-bold leading-none tracking-tight text-white">GAMI</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/70">Wallet app</p>
              </div>
            </div>
            <span className="border border-white/40 bg-white/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white">
              Scan to play
            </span>
          </div>
        </div>

        <div className="bg-white px-5 py-6 text-center text-black">
          <p className="font-display text-lg font-bold">Unlock your Gami Wallet</p>
          <p className="mt-1 text-xs text-gray-500">Point your camera at the code</p>
          <div className="relative mx-auto mt-5 w-fit border-2 border-black bg-white p-2">
            <img src={qrCodeUrl} alt="QR code to open Gami Wallet" className="h-48 w-48" width={192} height={192} />
            <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-white bg-primary shadow-md">
              <GamiLogo className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
            <span>Scan</span>
            <span className="h-1 w-1 rotate-45 bg-primary" />
            <span>Play</span>
            <span className="h-1 w-1 rotate-45 bg-primary" />
            <span>Earn</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-x-2 border-b-2 border-black bg-[#15121f] px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">Powered by $GAMI</p>
          <div className="flex gap-1" aria-hidden="true">
            <span className="h-2 w-2 bg-primary" />
            <span className="h-2 w-2 bg-gami-accent" />
            <span className="h-2 w-2 bg-white" />
          </div>
        </div>
      </div>

      <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-muted">
        Scan with any camera to open Gami Wallet
      </p>

      <div className="mt-8 space-y-3">
        <a
          href={deepLink}
          className="gami-gradient sticker-shadow flex items-center justify-center gap-3 border-2 border-black py-4 font-display font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
        >
          <GamiLogo className="h-5 w-5" />
          Open Gami Wallet
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
