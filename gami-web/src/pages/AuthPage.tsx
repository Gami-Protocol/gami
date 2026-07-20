import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import {
  confirmPhoneSignIn,
  createPhoneRecaptcha,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  startPhoneSignIn,
  signUpWithEmail,
} from '@/lib/firebase-auth';
import { isFirebaseConfigured } from '@/lib/firebase';

type Mode = 'sign-in' | 'sign-up' | 'phone' | 'reset';

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, ready, configured, signOut } = useFirebaseAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const nextPath = params.get('next') || '/waitlist';

  useEffect(() => {
    document.title = 'Sign in — Gami Protocol';
  }, []);

  useEffect(() => {
    if (ready && user) {
      // Stay on page if they just signed in so they see success, unless next is set.
    }
  }, [ready, user]);

  function clearFeedback() {
    setStatus('idle');
    setMessage('');
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    clearFeedback();
    setStatus('loading');

    const result =
      mode === 'sign-up'
        ? await signUpWithEmail(email, password, fullName)
        : await signInWithEmail(email, password);

    if (!result.ok) {
      setStatus('error');
      setMessage(result.error);
      return;
    }

    setStatus('done');
    setMessage('Signed in successfully.');
    navigate(nextPath);
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    clearFeedback();
    setStatus('loading');
    const result = await resetPassword(email);
    if (!result.ok) {
      setStatus('error');
      setMessage(result.error ?? 'Could not send reset email');
      return;
    }
    setStatus('done');
    setMessage('Password reset email sent. Check your inbox.');
  }

  async function handleGoogle() {
    clearFeedback();
    setStatus('loading');
    const result = await signInWithGoogle();
    if (!result.ok) {
      setStatus('error');
      setMessage(result.error);
      return;
    }
    setStatus('done');
    navigate(nextPath);
  }

  async function handleSendSms(e: FormEvent) {
    e.preventDefault();
    clearFeedback();
    setStatus('loading');

    try {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // ignore
        }
      }
      recaptchaRef.current = createPhoneRecaptcha('firebase-recaptcha');
      const result = await startPhoneSignIn(phone, recaptchaRef.current);
      if (!result.ok) {
        setStatus('error');
        setMessage(result.error);
        return;
      }
      setConfirmation(result.confirmation);
      setStatus('done');
      setMessage('SMS code sent. Enter it below.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not start phone sign-in');
    }
  }

  async function handleConfirmSms(e: FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    clearFeedback();
    setStatus('loading');
    const result = await confirmPhoneSignIn(confirmation, smsCode);
    if (!result.ok) {
      setStatus('error');
      setMessage(result.error);
      return;
    }
    setStatus('done');
    navigate(nextPath);
  }

  if (!configured && !isFirebaseConfigured()) {
    return (
      <>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 pt-28">
          <GamiTokenLogo className="mb-6 h-14 w-14 neo-border" />
          <h1 className="mb-4 font-display text-4xl font-bold uppercase italic">Firebase Auth</h1>
          <p className="text-gray-400">
            Add your Firebase web config to <code className="text-gami-accent">gami-web/.env</code>{' '}
            (<code className="text-gami-accent">VITE_FIREBASE_*</code>) for Firebase project{' '}
            <span className="text-white">gami-protocol</span>.
          </p>
        </div>
        <GamiFooter />
      </>
    );
  }

  if (ready && user) {
    return (
      <>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 pt-28">
          <GamiTokenLogo className="mb-6 h-14 w-14 neo-border" />
          <h1 className="mb-4 font-display text-4xl font-bold uppercase italic">Signed in</h1>
          <p className="mb-2 text-gray-300">
            {user.displayName || user.email || user.phoneNumber}
          </p>
          <p className="mb-8 font-mono text-xs text-gray-500">{user.uid}</p>
          <div className="flex flex-col gap-3">
            <Link
              to="/waitlist"
              className="gami-gradient neo-border py-4 text-center font-display font-bold uppercase tracking-widest shadow-brutal"
            >
              Continue to Waitlist
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="border-2 border-white py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black"
            >
              Sign out
            </button>
          </div>
        </div>
        <GamiFooter />
      </>
    );
  }

  return (
    <>
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 pb-16 pt-28">
        <GamiTokenLogo className="mb-6 h-14 w-14 neo-border" />
        <h1 className="mb-2 font-display text-4xl font-bold uppercase italic md:text-5xl">
          {mode === 'sign-up' ? 'Create account' : mode === 'phone' ? 'Phone sign-in' : mode === 'reset' ? 'Reset password' : 'Sign in'}
        </h1>
        <p className="mb-8 text-gray-400">
          Firebase Authentication — email/password, Google, or phone.
        </p>

        <div className="mb-6 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest">
          {(
            [
              ['sign-in', 'Email'],
              ['sign-up', 'Sign up'],
              ['phone', 'Phone'],
              ['reset', 'Reset'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                clearFeedback();
                setConfirmation(null);
              }}
              className={`border px-3 py-2 ${
                mode === id
                  ? 'border-gami-accent bg-gami-accent/20 text-gami-accent'
                  : 'border-white/20 text-gray-400 hover:border-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {(mode === 'sign-in' || mode === 'sign-up') && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'sign-up' ? (
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  Full name
                </label>
                <input
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            ) : null}
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Email
              </label>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="gami-gradient w-full py-4 font-display font-bold uppercase tracking-widest neo-border shadow-brutal disabled:opacity-60"
            >
              {status === 'loading' ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Email
              </label>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="gami-gradient w-full py-4 font-display font-bold uppercase tracking-widest neo-border shadow-brutal disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        {mode === 'phone' && (
          <div className="space-y-4">
            <form onSubmit={handleSendSms} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  Phone (E.164)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+15551234567"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="gami-gradient w-full py-4 font-display font-bold uppercase tracking-widest neo-border shadow-brutal disabled:opacity-60"
              >
                {status === 'loading' && !confirmation ? 'Sending SMS…' : 'Send SMS code'}
              </button>
            </form>

            {confirmation ? (
              <form onSubmit={handleConfirmSms} className="space-y-4">
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                    Verification code
                  </label>
                  <input
                    inputMode="numeric"
                    required
                    className="form-input"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full border-2 border-white py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black disabled:opacity-60"
                >
                  Verify & sign in
                </button>
              </form>
            ) : null}
          </div>
        )}

        {mode !== 'phone' && mode !== 'reset' ? (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="font-mono text-[10px] uppercase text-gray-500">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={status === 'loading'}
              className="w-full border-2 border-white bg-white py-4 font-display font-bold uppercase tracking-widest text-black transition-all hover:bg-gami-accent hover:text-white disabled:opacity-60"
            >
              Continue with Google
            </button>
          </>
        ) : null}

        {message ? (
          <p
            className={`mt-6 font-mono text-sm ${
              status === 'error' ? 'text-red-300' : 'text-gami-accent'
            }`}
          >
            {message}
          </p>
        ) : null}

        {/* reCAPTCHA mounts here for phone auth */}
        <div id="firebase-recaptcha" />
      </div>
      <GamiFooter />
    </>
  );
}
