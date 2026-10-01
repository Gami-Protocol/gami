'use client';

import { useEffect, useState } from 'react';

const TARGET = Date.UTC(2026, 9, 1, 16, 0, 0); // Oct 1, 2026 16:00 UTC placeholder

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

export function TgeCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const value = parts(TARGET - now);

  return (
    <div className="grid grid-cols-4 gap-3">
      {([
        ['Days', value.days],
        ['Hours', value.hours],
        ['Mins', value.minutes],
        ['Secs', value.seconds],
      ] as const).map(([label, amount]) => (
        <div
          key={label}
          className="rounded-2xl border border-white/10 bg-black/30 px-3 py-4 text-center"
        >
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums">
            {String(amount).padStart(2, '0')}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
        </div>
      ))}
    </div>
  );
}
