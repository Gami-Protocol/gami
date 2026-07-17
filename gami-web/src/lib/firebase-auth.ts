import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';

import { getFirebase } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/firebase-users';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export type AuthErrorResult = { ok: false; error: string };
export type AuthSuccessResult = { ok: true; user: User };
export type AuthResult = AuthSuccessResult | AuthErrorResult;

function mapAuthError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code)
    : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase Auth. Add it in the Firebase console.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/invalid-phone-number':
      return 'Enter a valid phone number in E.164 format (e.g. +15551234567).';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code.';
    case 'auth/missing-verification-code':
      return 'Enter the SMS verification code.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in the Firebase project.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed.';
  }
}

async function afterSignIn(user: User): Promise<AuthSuccessResult> {
  await upsertUserProfile(user);
  return { ok: true, user };
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  const fb = getFirebase();
  if (!fb) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(fb.auth, callback);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  try {
    const cred = await createUserWithEmailAndPassword(fb.auth, email.trim(), password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    return afterSignIn(cred.user);
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  try {
    const cred = await signInWithEmailAndPassword(fb.auth, email.trim(), password);
    return afterSignIn(cred.user);
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  try {
    const cred = await signInWithPopup(fb.auth, googleProvider);
    return afterSignIn(cred.user);
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function resetPassword(email: string): Promise<{ ok: boolean; error?: string }> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  try {
    await sendPasswordResetEmail(fb.auth, email.trim());
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function signOutUser(): Promise<{ ok: boolean; error?: string }> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  try {
    await signOut(fb.auth);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}

/** Invisible reCAPTCHA for phone auth. Container element must exist in the DOM. */
export function createPhoneRecaptcha(containerOrId: string | HTMLElement): RecaptchaVerifier {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase is not configured');

  return new RecaptchaVerifier(fb.auth, containerOrId, {
    size: 'invisible',
  });
}

export async function startPhoneSignIn(
  phoneNumber: string,
  verifier: RecaptchaVerifier,
): Promise<{ ok: true; confirmation: ConfirmationResult } | AuthErrorResult> {
  const fb = getFirebase();
  if (!fb) return { ok: false, error: 'Firebase is not configured' };

  try {
    const confirmation = await signInWithPhoneNumber(fb.auth, phoneNumber.trim(), verifier);
    return { ok: true, confirmation };
  } catch (error) {
    try {
      verifier.clear();
    } catch {
      // ignore
    }
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function confirmPhoneSignIn(
  confirmation: ConfirmationResult,
  code: string,
): Promise<AuthResult> {
  try {
    const cred = await confirmation.confirm(code.trim());
    return afterSignIn(cred.user);
  } catch (error) {
    return { ok: false, error: mapAuthError(error) };
  }
}
