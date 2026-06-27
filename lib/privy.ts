/**
 * Privy configuration + availability gate.
 *
 * Privy's Expo SDK relies on native modules (secure-store, passkeys, native
 * extensions) that are NOT present on web or in Expo Go. We therefore detect
 * whether Privy can actually run and expose `privyEnabled`. When it can't, the
 * app falls back to the local mock wallet path so the preview keeps working.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  privyAppId?: string;
  privyClientId?: string;
};

export const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? extra.privyAppId ?? '';
export const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? extra.privyClientId ?? '';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * True only when Privy is configured AND the runtime can load its native
 * modules (native platform, not Expo Go). On web / Expo Go this is false and
 * callers should use the local fallback.
 */
export const privyEnabled =
  Boolean(PRIVY_APP_ID && PRIVY_CLIENT_ID) && Platform.OS !== 'web' && !isExpoGo;
