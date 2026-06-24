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

function message(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return fallback;
}

/** Send a signup code to a new email. */
export async function signUpWithEmail(email: string): Promise<AuthResult> {
  if (!hasBackend) return { ok: true };
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: message(error, 'Could not send your code.') };
  return { ok: true };
}

/** Send a login code to an existing email. */
export async function signInWithEmail(email: string): Promise<AuthResult> {
  if (!hasBackend) return { ok: true };
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  });
  if (error) {
    // Supabase returns "Signups not allowed for otp" when the email is unknown.
    const raw = message(error, '');
    if (/not allowed|not found|no user/i.test(raw)) {
      return { ok: false, error: 'No account with that email. Create a wallet first.' };
    }
    return { ok: false, error: message(error, 'Could not send your code.') };
  }
  return { ok: true };
}

/** Verify a 6-digit code. `mode` decides whether we relink an existing profile. */
export async function verifyCode(
  email: string,
  token: string,
  mode: 'signup' | 'login',
): Promise<AuthResult> {
  const store = useOnboardingStore.getState();

  if (!hasBackend) {
    // No backend configured — treat as a local-only account.
    store.setAuthUser(`local-${Date.now()}`, email.trim().toLowerCase());
    return { ok: true };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });
  if (error || !data.user) {
    return { ok: false, error: message(error, 'That code did not match. Try again.') };
  }

  const userId = data.user.id;
  store.setAuthUser(userId, data.user.email ?? email);

  if (mode === 'login') {
    const profile = await fetchProfile(userId);
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
    }
  }

  return { ok: true };
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
