/**
 * Privy configuration + availability gate.
 *
 * Privy is the single identity + wallet provider for Gami: signup, login and
 * the embedded wallet all come from privy.io. There is no local/mock wallet
 * path any more.
 *
 * Two SDKs back this, picked per platform by Metro's `.web` resolution:
 *   - native  -> `@privy-io/expo` (see `lib/privy-bridge.ts`)
 *   - web     -> `@privy-io/react-auth` (see `lib/privy-bridge.web.ts`)
 *
 * Expo Go is the one runtime Privy cannot run in — its native modules
 * (secure-store extensions, passkeys) are not part of the Expo Go binary.
 * There we surface a clear "use a dev build" error instead of silently
 * minting a throwaway address.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  privyAppId?: string;
  privyClientId?: string;
};

/** Public Privy App ID for Gami (safe to ship; override via env). */
export const DEFAULT_PRIVY_APP_ID = 'cmrz2f6jc01560djmtczc288n';

export const PRIVY_APP_ID =
  process.env.EXPO_PUBLIC_PRIVY_APP_ID?.trim() || extra.privyAppId?.trim() || DEFAULT_PRIVY_APP_ID;

/**
 * Native-only client ID (Privy Dashboard → App clients). Optional: the Expo
 * SDK accepts an app ID alone, and it is unused on web.
 */
export const PRIVY_CLIENT_ID =
  process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID?.trim() || extra.privyClientId?.trim() || '';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** True when an app ID is present — i.e. the build is pointed at a Privy app. */
export const privyConfigured = Boolean(PRIVY_APP_ID);

/**
 * True when Privy can actually run in this runtime. False only in Expo Go
 * (native modules missing) or when no app ID is configured. Web is supported
 * via `@privy-io/react-auth`.
 */
export const privyEnabled = privyConfigured && !(isExpoGo && Platform.OS !== 'web');

/** Human-readable reason shown when `privyEnabled` is false. */
export function privyUnavailableReason(): string {
  if (!privyConfigured) {
    return 'Wallet signup is not configured. Set EXPO_PUBLIC_PRIVY_APP_ID and rebuild.';
  }
  return 'Wallet signup needs a Gami dev build — Expo Go cannot load the Privy modules.';
}
