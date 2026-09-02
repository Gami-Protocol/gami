/**
 * Privy provider wrapper (web).
 *
 * The Expo SDK is native-only, so on web we mount `@privy-io/react-auth`'s
 * provider with the same embedded-wallet policy as native: every user who logs
 * in gets a Privy embedded Ethereum wallet. `lib/privy-bridge.web.ts` reads
 * from this provider.
 */

import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

import { PRIVY_APP_ID, PRIVY_CLIENT_ID, privyConfigured } from '@/lib/privy';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Without an app ID there is nothing to mount; the onboarding screens surface
  // `privyUnavailableReason()` instead of silently creating a fake wallet.
  if (!privyConfigured) return <>{children}</>;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{
        loginMethods: ['email'],
        appearance: { theme: 'dark', accentColor: '#6E3CFB' },
        embeddedWallets: { ethereum: { createOnLogin: 'all-users' } },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
