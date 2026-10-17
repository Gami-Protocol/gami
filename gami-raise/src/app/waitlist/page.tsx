'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [intent, setIntent] = useState('1000');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          walletAddress: wallet || undefined,
          intentUsd: Number(intent) || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to join waitlist');
      toast.success('You’re on the waitlist');
      setEmail('');
      setWallet('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Waitlist failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      eyebrow="Waitlist"
      title="Reserve early access"
      description="Join the Gami raise waitlist for phase updates, whitelist windows, and TGE announcements."
    >
      <Card className="mx-auto max-w-xl">
        <CardTitle>Join the waitlist</CardTitle>
        <CardDescription>
          We’ll sync your email and optional wallet for eligibility and referral attribution.
        </CardDescription>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <Input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            placeholder="Wallet address (optional)"
            value={wallet}
            onChange={(event) => setWallet(event.target.value)}
          />
          <Input
            type="number"
            min={100}
            placeholder="Intended USD"
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting…' : 'Join waitlist'}
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}
