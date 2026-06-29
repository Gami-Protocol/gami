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
  /**
   * Ensure an embedded Ethereum wallet exists and return its address.
   * `createOnLogin: 'all-users'` usually handles this, but the wallet is
   * provisioned asynchronously after login — this awaits/creates it so callers
   * never fall back to a mock address.
   */
  ensureWallet: () => Promise<string | null>;
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

/** Read a property from an object without an unsafe cast. */
function prop(o: object, key: string): unknown {
  return Reflect.get(o, key);
}

/**
 * Returns true when an account entry looks like an Ethereum embedded wallet.
 * The SDK shape can differ across versions (snake_case vs. camelCase fields),
 * so we check both variants defensively.
 */
function isEthEmbedded(a: object): boolean {
  const type = prop(a, 'type');
  const chain = prop(a, 'chain_type') ?? prop(a, 'chainType');
  const looksWallet = type === 'wallet' || type === 'embedded';
  const looksEth = chain === undefined || chain === 'ethereum';
  return looksWallet && looksEth && typeof prop(a, 'address') === 'string';
}

/**
 * Pull the embedded Ethereum wallet address out of a `create()` result.
 * The SDK shape can differ across versions (snake_case `linked_accounts` vs.
 * camelCase `linkedAccounts`, `chain_type` vs. `chainType`), so we scan
 * defensively for the first Ethereum embedded-wallet entry with an address.
 */
function extractEthAddress(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null;
  const user = prop(res, 'user');
  if (!user || typeof user !== 'object') return null;
  const accounts = prop(user, 'linked_accounts') ?? prop(user, 'linkedAccounts');
  if (!Array.isArray(accounts)) return null;

  for (const raw of accounts) {
    if (raw && typeof raw === 'object' && isEthEmbedded(raw)) {
      const address = prop(raw, 'address');
      if (typeof address === 'string') return address;
    }
  }
  return null;
}

export function usePrivyBridge(): PrivyBridge {
  const { user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { wallets, create } = useEmbeddedEthereumWallet();

  const walletAddress = wallets?.[0]?.address ?? null;

  const ensureWallet = useCallback(async (): Promise<string | null> => {
    // Already provisioned (auto-created on login or previously created).
    const existing = wallets?.[0]?.address;
    if (existing) return existing;

    // No wallet yet — create one explicitly. `createOnLogin: 'all-users'`
    // provisions asynchronously, so on the first pass after login `wallets`
    // may still be empty; create() returns the updated user with the embedded
    // account linked, from which we pull the Ethereum address.
    try {
      const res = (await create?.()) as unknown;
      return extractEthAddress(res) ?? wallets?.[0]?.address ?? null;
    } catch {
      // If create races with the auto-create, the address may now be present.
      return wallets?.[0]?.address ?? null;
    }
  }, [create, wallets]);

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
    ensureWallet,
    logout: async () => {
      try {
        await logout();
      } catch {
        // ignore
      }
    },
  };
}
