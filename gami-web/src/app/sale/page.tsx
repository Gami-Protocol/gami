'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SaleStats {
  total_raised_usd: number;
  total_allocation_gami: number;
  participants_approved: number;
  waitlist_count: number;
  hard_cap_usd: number;
  current_phase: string;
}

export default function SalePage() {
  const [stats, setStats] = useState<SaleStats | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return;
    fetch(`${base}/functions/v1/sale-stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() =>
        setStats({
          total_raised_usd: 0,
          total_allocation_gami: 0,
          participants_approved: 0,
          waitlist_count: 0,
          hard_cap_usd: 2_160_000,
          current_phase: 'public',
        }),
      );
  }, []);

  const raised = stats?.total_raised_usd ?? 0;
  const cap = stats?.hard_cap_usd ?? 2_160_000;
  const pct = Math.min(100, (raised / cap) * 100);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold">Token Sale</h1>
      <p className="mt-2 text-muted">Phase: <span className="font-mono text-primary uppercase">{stats?.current_phase ?? 'public'}</span></p>

      <div className="sticker-shadow mt-8 border-2 border-white/10 bg-surface p-8">
        <div className="flex justify-between font-mono text-sm">
          <span>Raised</span>
          <span>${raised.toLocaleString()} / ${cap.toLocaleString()}</span>
        </div>
        <div className="mt-3 h-4 bg-white/10">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-mono text-2xl font-bold text-primary">{stats?.participants_approved ?? 0}</p>
            <p className="text-xs text-muted">Participants</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-secondary">{stats?.waitlist_count ?? 0}</p>
            <p className="text-xs text-muted">Waitlist</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold">$0.012</p>
            <p className="text-xs text-muted">Public Price</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/sale/contribute" className="sticker-shadow bg-primary px-8 py-4 font-display font-bold uppercase">
          Contribute Now
        </Link>
        <Link href="/wallet" className="border-2 border-white/20 px-8 py-4 font-display font-bold uppercase hover:border-primary">
          Download Wallet
        </Link>
      </div>
    </div>
  );
}
