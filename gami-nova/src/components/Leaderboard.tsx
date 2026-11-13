import { buildLeaderboard, rewardShare } from '@/lib/leaderboard';

export function Leaderboard({ yourXp }: { yourXp: number }) {
  const entries = buildLeaderboard(yourXp);

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Weekly reward distribution
      </h2>
      <ul className="space-y-2">
        {entries.map((entry, i) => (
          <li
            key={entry.name}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              entry.isYou ? 'bg-gami-purple/20 ring-1 ring-gami-purple' : 'bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2 font-mono text-white/90">
              <span className="w-5 text-muted">#{i + 1}</span>
              {entry.name}
              {entry.isYou && (
                <span className="rounded bg-gami-purple px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  you
                </span>
              )}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-muted">{entry.xp.toLocaleString()} XP</span>
              <span className="text-xs font-semibold text-nova-xp">
                {(rewardShare(entry, entries) * 100).toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-snug text-muted">
        Points-based ranking only — illustrative, no token or cash payout attached.
      </p>
    </div>
  );
}
