/**
 * Auth bridge hook.
 *
 * Privy is the only identity + wallet provider. Signup, login and the embedded
 * wallet all come from privy.io, on native (`@privy-io/expo`) and on web
 * (`@privy-io/react-auth`) alike — the screens don't branch on platform.
 *
 * Supabase is still the off-chain profile store (handle / XP / settings) via
 * the helpers in `lib/auth.ts`, keyed by the Privy user id. It is no longer an
 * auth backend, and there is no local mock-wallet fallback.
 */

import { useCallback } from 'react';

import { type AuthResult, type VerifyResult, relinkProfile } from '@/lib/auth';
import { privyEnabled, privyUnavailableReason } from '@/lib/privy';
import { useOnboardingStore } from '@/lib/store';
import { usePrivyBridge } from '@/lib/privy-bridge';

export interface AuthApi {
  /** Send a 6-digit Privy code for signup (new account). */
  sendSignupCode: (email: string) => Promise<AuthResult>;
  /** Send a 6-digit Privy code for login (existing account). */
  sendLoginCode: (email: string) => Promise<AuthResult>;
  /** Verify a 6-digit code. `mode` decides signup vs. relink-on-login. */
  verify: (email: string, code: string, mode: 'signup' | 'login') => Promise<VerifyResult>;
  /** The Privy embedded wallet address, if one has been provisioned. */
  walletAddress: string | null;
  /**
   * Resolve the embedded wallet address, creating it if Privy hasn't yet.
   * Returns null when Privy could not provision one — callers must treat that
   * as a failure rather than falling back to a generated address.
   */
  ensureWallet: () => Promise<string | null>;
  /** Whether Privy can run in this runtime (false only in Expo Go / unconfigured). */
  usingPrivy: boolean;
}

export function useAuth(): AuthApi {
  const privy = usePrivyBridge();
  const storeWallet = useOnboardingStore((s) => s.walletAddress);
  const setAuthUser = useOnboardingStore((s) => s.setAuthUser);

  const unavailable = useCallback(
    async (): Promise<AuthResult> => ({ ok: false, error: privyUnavailableReason() }),
    [],
  );

  const sendSignupCode = useCallback(
    (email: string) => (privyEnabled ? privy.sendCode(email) : unavailable()),
    [privy, unavailable],
  );

  const sendLoginCode = useCallback(
    (email: string) => (privyEnabled ? privy.sendCode(email) : unavailable()),
    [privy, unavailable],
  );

  const verify = useCallback(
    async (email: string, code: string, mode: 'signup' | 'login'): Promise<VerifyResult> => {
      if (!privyEnabled) return { ok: false, error: privyUnavailableReason() };

      // Verify the OTP with Privy, which logs the user in and (per provider
      // config) creates the embedded wallet. Then relink the Supabase profile.
      const res = await privy.loginWithCode(email, code);
      if (!res.ok) return { ok: false, error: res.error };

      setAuthUser(res.userId, email);
      return relinkProfile(res.userId, mode);
    },
    [privy, setAuthUser],
  );

  const ensureWallet = useCallback(
    () => (privyEnabled ? privy.ensureWallet() : Promise.resolve(null)),
    [privy],
  );

  return {
    sendSignupCode,
    sendLoginCode,
    verify,
    walletAddress: privy.walletAddress ?? storeWallet,
    ensureWallet,
    usingPrivy: privyEnabled,
  };
}
