'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  subscribeWaitlistCount,
  subscribeWaitlistEmailAlert,
  unsubscribeWaitlistEmailAlert,
  type WaitlistStats,
} from '@/lib/firebase-waitlist-stats';
import { Button } from '@/components/ui/button';

const DEFAULT_ALERT_EMAIL = 'waitlist@gamiprotocol.io';

export function WaitlistLive() {
  const configured = isFirebaseConfigured();
  const [stats, setStats] = useState<WaitlistStats>({ count: 0, updatedAt: null });
  const [pulse, setPulse] = useState(false);
  const [email, setEmail] = useState(DEFAULT_ALERT_EMAIL);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
      `Subscribed ${email.trim().toLowerCase()}. You’ll get an email each time someone joins (when Resend is configured).`,
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

  if (!configured) {
    return (
      <div className="glass rounded-[2rem] p-8">
        <p className="text-zinc-300">
          Firebase is not configured. Set <code className="text-accent">NEXT_PUBLIC_FIREBASE_*</code>{' '}
          to enable the live counter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={`glass rounded-[2rem] p-8 transition-transform md:p-10 ${
          pulse ? 'scale-[1.015]' : ''
        }`}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Live · Firestore
          </span>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          People on the waitlist
        </p>
        <p className="mt-2 font-[family-name:var(--font-syne)] text-7xl font-semibold tabular-nums text-white md:text-8xl">
          {stats.count.toLocaleString()}
        </p>
        <p className="mt-4 font-mono text-xs text-zinc-500">
          {stats.updatedAt
            ? `Last update ${stats.updatedAt.toLocaleString()}`
            : 'Waiting for the first signup…'}
        </p>
      </div>

      <div className="glass rounded-[2rem] p-8 md:p-10">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold">
          Email me live updates
        </h2>
        <p className="mt-2 mb-6 text-sm text-zinc-400">
          Get an email with the new total every time someone joins. Alerts go to{' '}
          <code className="text-accent">waitlist@gamiprotocol.io</code> by default.
        </p>

        <form onSubmit={handleSubscribe} className="space-y-4">
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Alert email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-accent/40 focus:ring-2"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={status === 'loading'} className="flex-1">
              {status === 'loading' ? 'Saving…' : 'Subscribe to alerts'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleUnsubscribe()}
              disabled={status === 'loading'}
              className="flex-1"
            >
              Unsubscribe
            </Button>
          </div>
        </form>

        {message ? (
          <p className={`mt-4 font-mono text-sm ${status === 'error' ? 'text-red-300' : 'text-accent'}`}>
            {message}
          </p>
        ) : null}
      </div>

      <p className="font-mono text-xs uppercase tracking-widest">
        <Link href="/waitlist" className="text-zinc-400 transition-colors hover:text-accent">
          ← Waitlist form
        </Link>
      </p>
    </div>
  );
}
