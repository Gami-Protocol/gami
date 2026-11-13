import { levelFromXp } from '@/lib/xp';

export function XpBar({ totalXp }: { totalXp: number }) {
  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(totalXp);
  const pct = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gami-purple font-display text-sm font-bold text-white shadow-glow">
        {level}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Level {level}</span>
          <span>
            {xpIntoLevel} / {xpForNextLevel} XP
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gami-purple to-nova-glow transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
