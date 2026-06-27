/**
 * Privy provider wrapper (web / preview).
 *
 * Privy's Expo SDK is native-only, so on web we render children directly.
 * Auth + wallet on web fall back to the local mock path via `privyEnabled`.
 */

import type { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
