/**
 * Privy bridge (web).
 *
 * Same imperative surface as the native bridge (`lib/privy-bridge.ts`), backed
 * by `@privy-io/react-auth` instead of `@privy-io/expo`. Metro picks this file
 * for `Platform.OS === 'web'`, so screens import `@/lib/privy-bridge` and get
 * the right SDK for free.
 *
 * Signup, login and the embedded wallet are all Privy on web too — there is no
 * mock-wallet fallback.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  getEmbeddedConnectedWallet,
  useCreateWallet,
  useLoginWithEmail,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';

import type { AuthResult } from '@/lib/auth';

export interface PrivyLoginResult {
  ok: true;
  userId: string;
}
export type PrivyVerify = PrivyLoginResult | { ok: false; error: string };
export interface PrivyWalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export interface PrivyBridge {
  sendCode: (email: string) => Promise<AuthResult>;
  loginWithCode: (email: string, code: string) => Promise<PrivyVerify>;
  walletAddress: string | null;
  /** Ensure an embedded Ethereum wallet exists and return its address. */
  ensureWallet: () => Promise<string | null>;
  getWalletProvider: () => Promise<PrivyWalletProvider | null>;
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

/** How long `ensureWallet` waits for Privy's auto-created wallet to publish. */
const WALLET_POLL_INTERVAL_MS = 250;
const WALLET_POLL_ATTEMPTS = 16;

export function usePrivyBridge(): PrivyBridge {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  // `loginWithCode` resolves to void on web, so capture the authenticated user
  // from the completion callback instead of the promise result.
  const loggedInUserId = useRef<string | null>(null);
  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: ({ user: loggedIn }) => {
      loggedInUserId.current = loggedIn.id;
    },
  });

  const embedded = getEmbeddedConnectedWallet(wallets);
  const walletAddress = embedded?.address ?? null;

  // `ensureWallet` polls across awaits, so it needs the *current* wallet list
  // rather than the one captured when the callback was created.
  const walletsRef = useRef(wallets);
  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

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
    async (_email: string, code: string): Promise<PrivyVerify> => {
      try {
        loggedInUserId.current = null;
        await loginWithCode({ code: code.trim() });
        const userId = loggedInUserId.current ?? user?.id;
        if (!userId) return { ok: false, error: 'Login failed. Try again.' };
        return { ok: true, userId };
      } catch (e) {
        return { ok: false, error: friendly(errMessage(e, 'Could not verify your code.')) };
      }
    },
    [loginWithCode, user?.id],
  );

  const ensureWallet = useCallback(async (): Promise<string | null> => {
    const read = () => getEmbeddedConnectedWallet(walletsRef.current)?.address ?? null;

    const existing = read();
    if (existing) return existing;

    // `createOnLogin: 'all-users'` provisions asynchronously, so right after a
    // login the wallet list is usually still empty. Wait for it before asking
    // for a new one — `createWallet` throws when the user already has one.
    for (let i = 0; i < WALLET_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, WALLET_POLL_INTERVAL_MS));
      const address = read();
      if (address) return address;
    }

    try {
      const wallet = await createWallet();
      return wallet?.address ?? read();
    } catch {
      // Lost the race with the auto-create — the address should be there now.
      return read();
    }
  }, [createWallet]);

  return {
    sendCode: doSendCode,
    loginWithCode: doLoginWithCode,
    walletAddress,
    ensureWallet,
    getWalletProvider: async () => {
      if (!embedded) return null;
      // Narrow the SDK's EIP-1193 provider down to the request surface callers
      // use, so screens share one shape across native and web.
      const provider = await embedded.getEthereumProvider();
      return { request: (args) => provider.request(args) };
    },
    logout: async () => {
      try {
        await logout();
      } catch {
        // ignore
      }
    },
  };
}
