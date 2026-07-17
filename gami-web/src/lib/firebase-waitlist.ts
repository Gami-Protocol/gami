import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { getFirebase } from '@/lib/firebase';

export type WaitlistInput = {
  email: string;
  full_name?: string;
  wallet_address?: string;
  referral_code?: string;
  source?: string;
  uid?: string | null;
};

function normalizeWallet(wallet?: string): string | null {
  if (!wallet?.trim()) return null;
  return wallet.trim().toLowerCase();
}

/** Deterministic doc id so duplicate emails collide instead of creating parallel rows. */
export function waitlistDocId(email: string): string {
  return email.trim().toLowerCase();
}

export async function joinWaitlistFirestore(
  input: WaitlistInput,
): Promise<{ ok: boolean; error?: string; id?: string; status?: string }> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  const email = input.email.trim().toLowerCase();
  if (!email.includes('@')) {
    return { ok: false, error: 'Valid email required' };
  }

  const walletAddress = normalizeWallet(input.wallet_address);
  if (walletAddress && !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
    return { ok: false, error: 'wallet_address must be a valid 0x EVM address' };
  }

  const status = walletAddress ? 'wallet_linked' : 'registered';
  const id = waitlistDocId(email);
  const ref = doc(fb.db, 'waitlist', id);
  const uid = input.uid ?? fb.auth.currentUser?.uid ?? null;

  const shared = {
    email,
    fullName: input.full_name?.trim() || null,
    walletAddress,
    referralCode: input.referral_code?.trim() || null,
    source: input.source ?? 'web',
    status,
    uid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (fb.auth.currentUser) {
      try {
        await updateDoc(ref, shared);
        return { ok: true, id, status };
      } catch {
        // Document may not exist yet — fall through to create.
      }
    }

    await setDoc(ref, {
      ...shared,
      createdAt: serverTimestamp(),
    });
    return { ok: true, id, status };
  } catch (error) {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code)
        : '';
    // Unauthenticated create against an existing doc becomes an update and is denied.
    if (code === 'permission-denied') {
      return { ok: true, id, status };
    }
    const message = error instanceof Error ? error.message : 'Failed to join waitlist';
    return { ok: false, error: message };
  }
}
