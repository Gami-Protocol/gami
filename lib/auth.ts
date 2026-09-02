/**
 * Profile layer — the off-chain account row behind a Privy identity.
 *
 * Authentication itself is Privy (see `lib/useAuth.ts` + `lib/privy-bridge.ts`).
 * This module owns everything that happens *after* a Privy login:
 *
 *   relinkProfile(userId, mode) -> hydrate the local store from `profiles`
 *   syncProfile()               -> push local handle / wallet / XP back up
 *   signOut()                   -> clear the local profile
 *
 * The `profiles` table is the server source of truth for the wallet address,
 * handle and XP, keyed by the Privy user id. Every read/write here is
 * best-effort: onboarding must never be blocked by a backend hiccup.
 */

import { toAvatarColorId, toNovaTone } from '@/lib/config';
import { fetchProfile, hasBackend, saveProfile } from '@/lib/supabase';
import { useOnboardingStore } from '@/lib/store';

export type AuthResult = { ok: true } | { ok: false; error: string };

/**
 * Result of verifying a code. On success we report whether the relinked
 * profile has finished onboarding so the caller can route correctly.
 */
export type VerifyResult = { ok: true; onboarded: boolean } | { ok: false; error: string };

/**
 * After a successful Privy login, hydrate the local store from the server
 * `profiles` row. On login we relink an existing wallet/profile; on signup the
 * row does not exist yet, so the caller continues onboarding.
 */
export async function relinkProfile(
  userId: string,
  mode: 'signup' | 'login',
): Promise<VerifyResult> {
  const store = useOnboardingStore.getState();

  if (mode === 'login') {
    // Relink the wallet from the server profile. On a fresh verify the read can
    // land before the row is visible, so retry briefly before giving up.
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

/** Fetch the profile row, retrying a few times to ride out replication lag. */
async function fetchProfileWithRetry(userId: string) {
  if (!hasBackend) return null;
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
  if (!hasBackend || !s.userId) return;
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

/**
 * Clear the local profile. The Privy session itself is ended by the caller
 * (`usePrivyBridge().logout()`), which owns the SDK handle.
 */
export async function signOut(): Promise<void> {
  useOnboardingStore.getState().signOutLocal();
}

/**
 * Resolve the signed-in user id (used at boot to gate routing).
 *
 * Privy owns the session and only exposes it through React hooks, which the
 * splash screen cannot call before routing. The store persists the Privy user
 * id at login, so that is the boot-time source of truth.
 */
export async function currentUserId(): Promise<string | null> {
  return useOnboardingStore.getState().userId;
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
    if (!state.userId) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => void syncProfile(), 800);
  });
}
