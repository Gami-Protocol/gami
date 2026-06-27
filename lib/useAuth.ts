/**
 * Auth bridge hook.
 *
 * Unifies two auth backends behind one interface so the onboarding screens
 * don't branch on platform:
 *
 *   - Privy (native, configured): email + OTP login, embedded wallet auto-
 *     created on login. The wallet address comes from Privy.
 *   - Fallback (web / Expo Go / Privy unset): the existing Supabase email-OTP
 *     flow with the local mock wallet.
 *
 * Either way we keep the Supabase `profiles` row as the off-chain store of
 * handle / XP / settings via the helpers in `lib/auth.ts`.
 */

import { useCallback } from 'react';

import {
  type AuthResult,
  type VerifyResult,
  relinkProfile,
  signInWithEmail,
  signUpWithEmail,
  verifyCode as verifySupabaseCode,
} from '@/lib/auth';
import { privyEnabled } from '@/lib/privy';
import { useOnboardingStore } from '@/lib/store';
import { usePrivyBridge } from '@/lib/privy-bridge';

export interface AuthApi {
  /** Send a 6-digit code for signup (new account). */
  sendSignupCode: (email: string) => Promise<AuthResult>;
  /** Send a 6-digit code for login (existing account). */
  sendLoginCode: (email: string) => Promise<AuthResult>;
  /** Verify a 6-digit code. `mode` decides signup vs. relink-on-login. */
  verify: (email: string, code: string, mode: 'signup' | 'login') => Promise<VerifyResult>;
  /** The active embedded/mock wallet address, if any. */
  walletAddress: string | null;
  /** Whether the Privy backend is the active path (vs. Supabase fallback). */
  usingPrivy: boolean;
}

export function useAuth(): AuthApi {
  const privy = usePrivyBridge();
  const storeWallet = useOnboardingStore((s) => s.walletAddress);
  const setAuthUser = useOnboardingStore((s) => s.setAuthUser);

  const sendSignupCode = useCallback(
    (email: string) => (privyEnabled ? privy.sendCode(email) : signUpWithEmail(email)),
    [privy],
  );

  const sendLoginCode = useCallback(
    (email: string) => (privyEnabled ? privy.sendCode(email) : signInWithEmail(email)),
    [privy],
  );

  const verify = useCallback(
    async (email: string, code: string, mode: 'signup' | 'login'): Promise<VerifyResult> => {
      if (!privyEnabled) return verifySupabaseCode(email, code, mode);

      // Privy path: verify the OTP, which logs the user in and (per provider
      // config) creates the embedded wallet. Then relink the Supabase profile.
      const res = await privy.loginWithCode(email, code);
      if (!res.ok) return { ok: false, error: res.error };

      setAuthUser(res.userId, email);
      return relinkProfile(res.userId, mode);
    },
    [privy, setAuthUser],
  );

  return {
    sendSignupCode,
    sendLoginCode,
    verify,
    walletAddress: privyEnabled ? (privy.walletAddress ?? storeWallet) : storeWallet,
    usingPrivy: privyEnabled,
  };
}
