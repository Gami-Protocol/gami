import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  subscribeWaitlistCount,
  subscribeWaitlistEmailAlert,
  unsubscribeWaitlistEmailAlert,
  type WaitlistStats,
} from '@/lib/firebase-waitlist-stats';

const DEFAULT_ALERT_EMAIL = 'mattusmarcus@gmail.com';

export function WaitlistLivePage() {
  const configured = isFirebaseConfigured();
  const [stats, setStats] = useState<WaitlistStats>({ count: 0, updatedAt: null });
  const [pulse, setPulse] = useState(false);
  const [email, setEmail] = useState(DEFAULT_ALERT_EMAIL);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Live Waitlist — Gami Protocol';
  }, []);

  useEffect(() => {
    if (!configured) return;
    let prev = -1;
    return subscribeWaitlistCount((next) => {
      setStats(next);
      if (prev >= 0 && next.count !== prev) {
        setPulse(true);
        window.setTimeout(() => setPulse(false), 700);
      }
      prev = next.count;
    });
  }, [configured]);

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    const result = await subscribeWaitlistEmailAlert(email);
    if (!result.ok) {
      setStatus('error');
      setMessage(result.error ?? 'Could not subscribe');
      return;
    }
    setStatus('done');
    setMessage(
      `Subscribed ${email.trim().toLowerCase()}. You’ll get an email each time someone joins (when notify + Resend are configured).`,
    );
  }

  async function handleUnsubscribe() {
    setStatus('loading');
    setMessage('');
    const result = await unsubscribeWaitlistEmailAlert(email);
    if (!result.ok) {
      setStatus('error');
      setMessage(result.error ?? 'Could not unsubscribe');
      return;
    }
    setStatus('done');
    setMessage(`Unsubscribed ${email.trim().toLowerCase()}.`);
  }

  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <GamiTokenLogo className="mb-6 h-14 w-14 neo-border" />
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-gami-accent">
          Live feed
        </p>
        <h1 className="mb-4 font-display text-5xl font-bold uppercase italic md:text-6xl">
          Waitlist counter
        </h1>
        <p className="mb-10 max-w-xl text-gray-400">
          Watch signups in real time, and send live count updates to your email whenever someone
          joins the genesis waitlist.
        </p>

        {!configured ? (
          <div className="border-2 border-white/20 bg-black/40 p-8 neo-border">
            <p className="text-gray-300">
              Configure <code className="text-gami-accent">VITE_FIREBASE_*</code> in{' '}
              <code className="text-gami-accent">gami-web/.env</code> to enable the live counter and
              email alerts.
            </p>
            <Link to="/auth" className="mt-6 inline-block text-gami-accent underline">
              Firebase auth setup
            </Link>
          </div>
        ) : (
          <>
            <div
              className={`mb-10 border-4 border-black bg-gami-bg p-10 neo-border shadow-brutal-purple transition-transform ${
                pulse ? 'scale-[1.02]' : ''
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gami-accent opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-gami-accent" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
                  Live · Firestore
                </span>
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
                People on the waitlist
              </p>
              <p className="mt-2 font-display text-7xl font-bold tabular-nums text-white md:text-8xl">
                {stats.count.toLocaleString()}
              </p>
              <p className="mt-4 font-mono text-xs text-gray-500">
                {stats.updatedAt
                  ? `Last update ${stats.updatedAt.toLocaleString()}`
                  : 'Waiting for the first signup…'}
              </p>
            </div>

            <div className="border-2 border-white/10 bg-black/40 p-8 neo-border">
              <h2 className="mb-2 font-display text-2xl font-bold uppercase italic">
                Email me live updates
              </h2>
              <p className="mb-6 text-sm text-gray-400">
                Get an email with the new total every time someone joins. Uses Resend via the{' '}
                <code className="text-gami-accent">waitlist-notify</code> function.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                    Alert email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="gami-gradient flex-1 py-4 font-display font-bold uppercase tracking-widest neo-border shadow-brutal disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Saving…' : 'Subscribe to alerts'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUnsubscribe()}
                    disabled={status === 'loading'}
                    className="flex-1 border-2 border-white py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black disabled:opacity-60"
                  >
                    Unsubscribe
                  </button>
                </div>
              </form>

              {message ? (
                <p
                  className={`mt-4 font-mono text-sm ${
                    status === 'error' ? 'text-red-300' : 'text-gami-accent'
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </div>
          </>
        )}

        <div className="mt-10 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-widest">
          <Link to="/waitlist" className="text-gray-400 hover:text-gami-accent">
            ← Waitlist form
          </Link>
          <Link to="/sale" className="text-gray-400 hover:text-gami-accent">
            Sale dashboard
          </Link>
        </div>
      </div>
      <GamiFooter />
    </>
  );
}
