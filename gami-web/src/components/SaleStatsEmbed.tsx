import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchSaleStats } from '@/lib/sale';

export function SaleStatsEmbed() {
  const [raised, setRaised] = useState(0);
  const [cap, setCap] = useState(2_160_000);
  const [phase, setPhase] = useState('public');

  useEffect(() => {
    void fetchSaleStats().then((s) => {
      if (!s) return;
      setRaised(s.total_raised_usd);
      setCap(s.hard_cap_usd);
      setPhase(s.current_phase);
    });
  }, []);

  const pct = cap > 0 ? Math.min(100, (raised / cap) * 100) : 0;

  return (
    <div className="sticker-shadow mx-auto max-w-2xl border-2 border-white/10 bg-surface p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted">LIVE SALE · {phase.toUpperCase()}</p>
        <Link to="/sale" className="font-mono text-xs text-primary hover:underline">
          View dashboard →
        </Link>
      </div>
      <p className="mt-4 font-mono text-2xl font-bold">
        ${raised.toLocaleString()}{' '}
        <span className="text-base font-normal text-muted">/ ${cap.toLocaleString()}</span>
      </p>
      <div className="mt-3 h-3 bg-white/10">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
