import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import { getFirebase } from '@/lib/firebase';

export async function upsertUserProfile(user: User): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;

  const providers = user.providerData.map((p) => p.providerId).filter(Boolean);
  const ref = doc(fb.db, 'users', user.uid);
  const existing = await getDoc(ref);

  const base = {
    email: user.email?.toLowerCase() ?? null,
    displayName: user.displayName ?? null,
    phoneNumber: user.phoneNumber ?? null,
    photoURL: user.photoURL ?? null,
    providers,
    updatedAt: serverTimestamp(),
  };

  if (existing.exists()) {
    await updateDoc(ref, base);
    return;
  }

  await setDoc(ref, {
    ...base,
    createdAt: serverTimestamp(),
  });
}
