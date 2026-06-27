/**
 * Auth layer — Supabase email + 6-digit OTP, tied to the wallet profile.
 *
 * Flow:
 *   signUp(email)            -> Supabase emails a 6-digit code
 *   verifySignup(email,code) -> session created, profile row exists (trigger)
 *   signIn(email)            -> Supabase emails a 6-digit code (existing user)
 *   verifyLogin(email,code)  -> session created, profile relinked into store
 *
 * The `profiles` table is the server source of truth for the wallet address,
 * handle and XP. On login we hydrate the local store from it; while onboarding
 * we push local changes up via syncProfile().
 */

import { toAvatarColorId, toNovaTone } from '@/lib/config';
import { fetchProfile, hasBackend, saveProfile, supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/lib/store';

export type AuthResult = { ok: true } | { ok: false; error: string };

/**
 * Result of verifying a code. On success we report whether the relinked
 * profile has finished onboarding so the caller can route correctly.
 */
export type VerifyResult = { ok: true; onboarded: boolean } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return fallback;
}

/** Shown when no Supabase backend is reachable from this build. */
function offlineBackendError(): AuthResult {
  return {
    ok: false,
    error: "Can't reach the Gami backend. Check your connection and try again.",
  };
}

/** Map a thrown network/fetch failure to a human message. */
function networkError(e: unknown): string {
  return message(e, 'Network error. Check your connection and try again.');
}

/** Map a Supabase auth error to friendlier copy (rate limits are common). */
function friendlyAuthError(e: unknown): string {
  const raw = message(e, '');
  if (/rate limit|too many|seconds/i.test(raw)) {
    return 'Too many attempts. Wait a minute, then try again.';
  }
  if (/expired/i.test(raw)) return 'That code expired. Tap resend for a new one.';
  if (/invalid|incorrect|token/i.test(raw)) return 'That code did not match. Try again.';
  return raw.length > 0 ? raw : 'Could not send your code.';
}

/** Send a signup code to a new email. */
export async function signUpWithEmail(email: string): Promise<AuthResult> {
  if (!hasBackend) return offlineBackendError();
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) return { ok: false, error: friendlyAuthError(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }
}

/** Send a login code to an existing email. */
export async function signInWithEmail(email: string): Promise<AuthResult> {
  if (!hasBackend) return offlineBackendError();
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    if (error) {
      // Supabase returns variants of these when the email has no account yet.
      const raw = message(error, '');
      if (/not allowed|not found|no user|signups? not allowed|otp_disabled/i.test(raw)) {
        return { ok: false, error: 'No account with that email. Create a wallet first.' };
      }
      return { ok: false, error: friendlyAuthError(error) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }
}

/** Verify a 6-digit code. `mode` decides whether we relink an existing profile. */
export async function verifyCode(
  email: string,
  token: string,
  mode: 'signup' | 'login',
): Promise<VerifyResult> {
  const store = useOnboardingStore.getState();

  if (!hasBackend) {
    return {
      ok: false,
      error: "Can't reach the Gami backend. Check your connection and try again.",
    };
  }

  let userId: string;
  let userEmail: string;
  try {
    const res = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });
    if (res.error || !res.data.session || !res.data.user) {
      return { ok: false, error: friendlyAuthError(res.error) };
    }
    userId = res.data.user.id;
    userEmail = res.data.user.email ?? email;
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }

  store.setAuthUser(userId, userEmail);

  return relinkProfile(userId, mode);
}

/**
 * After a successful auth (Supabase OR Privy), hydrate the local store from the
 * server `profiles` row. On login we relink an existing wallet/profile; on
 * signup the row may not exist yet, so the caller continues onboarding.
 */
export async function relinkProfile(
  userId: string,
  mode: 'signup' | 'login',
): Promise<VerifyResult> {
  const store = useOnboardingStore.getState();

  if (mode === 'login') {
    // Relink the wallet from the server profile. The signup trigger creates the
    // row, but on a fresh verify the read can land before the insert is visible,
    // so retry briefly before giving up.
    const profile = await fetchProfileWithRetry(userId);
    if (profile) {
      store.hydrateFromProfile({
        handle: profile.handle,
        walletAddress: profile.wallet_address,
        xp: profile.xp,
        spentGami: profile.spent_gami,
        avatarId: toAvatarColorId(profile.avatar_id),
        novaTone: toNovaTone(profile.nova_tone),
        interests: profile.interests,
        onboarded: profile.onboarded,
      });
      return { ok: true, onboarded: profile.onboarded };
    }
    // Signed in but no profile yet — send them through onboarding to create one.
    return { ok: true, onboarded: false };
  }

  return { ok: true, onboarded: false };
}

/** Fetch the profile row, retrying a few times to ride out trigger lag. */
async function fetchProfileWithRetry(userId: string) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

/** Push the current local profile/wallet/XP up to the server row. */
export async function syncProfile(): Promise<void> {
  const s = useOnboardingStore.getState();
  if (!hasBackend || !s.userId || s.userId.startsWith('local-')) return;
  await saveProfile(s.userId, {
    handle: s.handle || null,
    wallet_address: s.walletAddress,
    xp: s.xp,
    spent_gami: s.spentGami,
    avatar_id: s.avatarId,
    nova_tone: s.novaTone,
    interests: s.interests,
    onboarded: s.onboarded,
  });
}

/** Sign out of Supabase and clear the local profile. */
export async function signOut(): Promise<void> {
  if (hasBackend) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore network failures on sign-out
    }
  }
  useOnboardingStore.getState().signOutLocal();
}

/** Resolve the current session's user id (used at boot to gate routing). */
export async function currentUserId(): Promise<string | null> {
  if (!hasBackend) return useOnboardingStore.getState().userId;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Keep the server profile row in sync with local XP / spend / onboarding as the
 * user plays. Debounced so rapid XP bumps coalesce into one write. Idempotent —
 * safe to call at module load exactly once.
 */
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncWired = false;

export function wireProfileSync(): void {
  if (syncWired) return;
  syncWired = true;
  useOnboardingStore.subscribe((state, prev) => {
    const relevantChanged =
      state.xp !== prev.xp ||
      state.spentGami !== prev.spentGami ||
      state.onboarded !== prev.onboarded ||
      state.handle !== prev.handle ||
      state.walletAddress !== prev.walletAddress;
    if (!relevantChanged) return;
    if (!state.userId || state.userId.startsWith('local-')) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => void syncProfile(), 800);
  });
}
