'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContributePage() {
  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!base || !key) {
      setStatus('error');
      setMessage('Backend not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    try {
      const res = await fetch(`${base}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ email, wallet_address: wallet || null, source: 'sale' }),
      });
      if (!res.ok) throw new Error('Failed to join waitlist');
      setStatus('done');
      setMessage('You are on the waitlist! Download the Gami Wallet to claim your XP bonus.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Contribute</h1>
      <p className="mt-2 text-muted">Complete KYC, connect wallet, and contribute USDC or ETH on Base.</p>

      <form onSubmit={handleWaitlist} className="mt-8 space-y-4">
        <div>
          <label className="font-mono text-xs text-muted">EMAIL</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="font-mono text-xs text-muted">WALLET ADDRESS (optional)</label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none"
            placeholder="0x..."
          />
        </div>
        <div>
          <label className="font-mono text-xs text-muted">AMOUNT USD (when sale opens)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none"
            placeholder="100"
            min="10"
            max="2500"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="sticker-shadow w-full bg-primary py-4 font-display font-bold uppercase disabled:opacity-50"
        >
          {status === 'loading' ? 'Submitting...' : 'Join Waitlist & Reserve Spot'}
        </button>
      </form>

      {message && (
        <p className={`mt-4 font-mono text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}

      <div className="mt-8 border border-white/10 p-4 text-sm text-muted">
        <p>1. Join waitlist above</p>
        <p>2. Complete KYC when notified</p>
        <p>3. Connect wallet via Privy</p>
        <p>4. Contribute USDC on Base</p>
        <p>5. Claim vested tokens at TGE in the Gami Wallet</p>
      </div>

      <Link href="/wallet" className="mt-6 inline-block font-mono text-sm text-primary hover:underline">
        → Download Gami Wallet for +50 XP bonus
      </Link>
    </div>
  );
}
