/**
 * Privy bridge (native).
 *
 * Thin wrapper over Privy's Expo hooks that exposes the imperative surface our
 * auth bridge needs. The embedded Ethereum wallet is auto-created on login by
 * the provider config; here we just read its address.
 */

import { useCallback } from 'react';
import { useEmbeddedEthereumWallet, useLoginWithEmail, usePrivy } from '@privy-io/expo';

import type { AuthResult } from '@/lib/auth';

export interface PrivyLoginResult {
  ok: true;
  userId: string;
}
export type PrivyVerify = PrivyLoginResult | { ok: false; error: string };

export interface PrivyBridge {
  sendCode: (email: string) => Promise<AuthResult>;
  loginWithCode: (email: string, code: string) => Promise<PrivyVerify>;
  walletAddress: string | null;
  logout: () => Promise<void>;
}

function errMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return fallback;
}

function friendly(raw: string): string {
  if (/rate limit|too many|seconds/i.test(raw)) {
    return 'Too many attempts. Wait a minute, then try again.';
  }
  if (/expired/i.test(raw)) return 'That code expired. Tap resend for a new one.';
  if (/invalid|incorrect|code/i.test(raw)) return 'That code did not match. Try again.';
  return raw.length > 0 ? raw : 'Could not verify your code.';
}

export function usePrivyBridge(): PrivyBridge {
  const { user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { wallets } = useEmbeddedEthereumWallet();

  const walletAddress = wallets?.[0]?.address ?? null;

  const doSendCode = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        await sendCode({ email: email.trim().toLowerCase() });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: friendly(errMessage(e, 'Could not send your code.')) };
      }
    },
    [sendCode],
  );

  const doLoginWithCode = useCallback(
    async (email: string, code: string): Promise<PrivyVerify> => {
      try {
        const result = await loginWithCode({
          code: code.trim(),
          email: email.trim().toLowerCase(),
        });
        const userId = result?.id ?? user?.id;
        if (!userId) return { ok: false, error: 'Login failed. Try again.' };
        return { ok: true, userId };
      } catch (e) {
        return { ok: false, error: friendly(errMessage(e, 'Could not verify your code.')) };
      }
    },
    [loginWithCode, user?.id],
  );

  return {
    sendCode: doSendCode,
    loginWithCode: doLoginWithCode,
    walletAddress,
    logout: async () => {
      try {
        await logout();
      } catch {
        // ignore
      }
    },
  };
}
