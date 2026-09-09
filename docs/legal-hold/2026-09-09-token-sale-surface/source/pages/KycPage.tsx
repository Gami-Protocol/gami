import { Link } from 'react-router-dom';

import { ConnectWallet } from '@/components/ConnectWallet';
import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import { KycVerificationPanel } from '@/components/sale/KycVerificationPanel';
import { GeoBlockBanner } from '@/hooks/useGeoBlock';
import { useSaleAccount } from '@/hooks/useSaleAccount';

export function KycPage() {
  const { isConnected } = useSaleAccount();

  return (
    <>
      <div className="mx-auto max-w-lg px-6 py-16">
        <GamiTokenLogo className="mb-4 h-14 w-14" />
        <h1 className="font-display text-3xl font-bold">Identity verification</h1>
        <p className="mt-2 text-muted">
          Verify your identity to unlock $GAMI sale contributions. KYC is required before USDC can be
          accepted.
        </p>

        <GeoBlockBanner />

        <div className="mt-6 border-2 border-primary bg-surface p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold text-primary">WALLET REQUIRED</p>
              <p className="mt-1 text-xs text-muted">
                {isConnected
                  ? 'Connected. Complete the form and sign the verification message.'
                  : 'Sign in / connect a wallet to start KYC.'}
              </p>
            </div>
            <ConnectWallet />
          </div>
        </div>

        <div className="mt-8">
          <KycVerificationPanel
            onVerified={() => undefined}
            onPending={() => undefined}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 font-mono text-sm">
          <Link to="/sale/contribute" className="text-primary hover:underline">
            → Continue to contribute flow
          </Link>
          <Link to="/sale" className="text-muted hover:text-white">
            ← Back to sale dashboard
          </Link>
        </div>
      </div>
      <GamiFooter variant="ico" />
    </>
  );
}
