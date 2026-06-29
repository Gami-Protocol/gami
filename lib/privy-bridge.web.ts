/**
 * Privy bridge (web / preview fallback).
 *
 * No Privy on web — every method reports the backend as unavailable so callers
 * fall back to the Supabase path (they check `privyEnabled` before using this).
 */

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
  ensureWallet: () => Promise<string | null>;
  logout: () => Promise<void>;
}

export function usePrivyBridge(): PrivyBridge {
  return {
    sendCode: async () => ({ ok: false, error: 'Privy is unavailable on web.' }),
    loginWithCode: async () => ({ ok: false, error: 'Privy is unavailable on web.' }),
    walletAddress: null,
    ensureWallet: async () => null,
    logout: async () => {},
  };
}
