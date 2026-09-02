/**
 * Privy provider wrapper (native).
 *
 * Mounts PrivyProvider when Privy can run, configured to auto-create an
 * embedded Ethereum wallet for every user on login. In Expo Go (no native
 * modules) we render children directly so the app still boots — onboarding
 * then reports `privyUnavailableReason()` rather than minting a fake wallet.
 */

import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/expo';

import { PRIVY_APP_ID, PRIVY_CLIENT_ID, privyEnabled } from '@/lib/privy';

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!privyEnabled) return <>{children}</>;
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{ embedded: { ethereum: { createOnLogin: 'all-users' } } }}
    >
      {children}
    </PrivyProvider>
  );
}
