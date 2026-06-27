/**
 * Privy provider wrapper (native).
 *
 * Mounts PrivyProvider when Privy is enabled, configured to
 * auto-create an embedded Ethereum wallet for every user on login. When Privy
 * is not configured, renders children directly so the app still boots.
 */

import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/expo';

import { PRIVY_APP_ID, PRIVY_CLIENT_ID, privyEnabled } from '@/lib/privy';

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!privyEnabled) return <>{children}</>;
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{ embedded: { ethereum: { createOnLogin: 'all-users' } } }}
    >
      {children}
    </PrivyProvider>
  );
}
