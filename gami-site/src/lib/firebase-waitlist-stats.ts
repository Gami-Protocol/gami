import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { getFirebase } from '@/lib/firebase';

export type WaitlistStats = {
  count: number;
  updatedAt: Date | null;
};

const STATS_PATH = ['stats', 'waitlist'] as const;

function normalizeAlertEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  // Firestore document IDs cannot contain `/`.
  if (!normalized.includes('@') || normalized.includes('/')) {
    return null;
  }
  return normalized;
}

export function subscribeWaitlistCount(
  onChange: (stats: WaitlistStats) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const fb = getFirebase();
  if (!fb) {
    onChange({ count: 0, updatedAt: null });
    return () => undefined;
  }

  const ref = doc(fb.db, ...STATS_PATH);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onChange({ count: 0, updatedAt: null });
        return;
      }
      const data = snap.data();
      const updatedAt = data.updatedAt?.toDate?.() ?? null;
      onChange({
        count: Number(data.count ?? 0),
        updatedAt,
      });
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function subscribeWaitlistEmailAlert(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  const normalized = normalizeAlertEmail(email);
  if (!normalized) {
    return { ok: false, error: 'Valid email required' };
  }

  const ref = doc(fb.db, 'waitlist_alert_subscribers', normalized);
  try {
    // Prefer update for existing subscribers so createdAt stays intact (rules).
    await updateDoc(ref, {
      active: true,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch {
    try {
      await setDoc(ref, {
        email: normalized,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Could not subscribe',
      };
    }
  }
}

export async function unsubscribeWaitlistEmailAlert(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  const normalized = normalizeAlertEmail(email);
  if (!normalized) {
    return { ok: false, error: 'Valid email required' };
  }

  try {
    await setDoc(
      doc(fb.db, 'waitlist_alert_subscribers', normalized),
      {
        email: normalized,
        active: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not unsubscribe',
    };
  }
}
