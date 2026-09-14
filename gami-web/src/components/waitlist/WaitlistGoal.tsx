import { WAITLIST_GOAL, formatGoal, formatGoalCompact, goalBarWidth } from '@/lib/waitlist-goal';

type Props = {
  /** Live signup count from the database. `null` while loading or unavailable. */
  count: number | null;
  className?: string;
};

/**
 * The 10,000,000 target, with real progress against it.
 *
 * The goal and the count are labelled separately and never merged into one
 * figure: "Goal" sits on the target, "on the list today" sits on whatever the
 * database returns. Someone reading this can tell at a glance which number is
 * an ambition and which is a fact, which is the whole point.
 */
export function WaitlistGoal({ count, className = '' }: Props) {
  return (
    <div className={`border-2 border-white/10 bg-black/40 p-6 neo-border ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
          Goal
        </span>
        <span className="font-display text-2xl font-bold tabular-nums text-gami-accent md:text-3xl">
          {formatGoal()}
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-gray-400">
        Ten million people earning XP and settling rewards onchain. That is the target Gami is
        built for, not a number reached.
      </p>

      <div
        className="h-2 w-full overflow-hidden border border-white/15 bg-white/5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={WAITLIST_GOAL}
        aria-valuenow={count ?? 0}
        aria-label={`Waitlist progress toward ${formatGoal()}`}
      >
        <div
          className="h-full bg-gami-purple transition-[width] duration-700"
          style={{ width: goalBarWidth(count ?? 0) }}
        />
      </div>

      {/*
        When the count is unavailable — backend unreachable, Supabase not
        configured — the slot is left empty rather than showing a spinner that
        never resolves. The goal above still stands on its own, and nothing on
        screen claims a number we could not read.
      */}
      <div className="mt-3 flex items-baseline justify-between gap-4 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-gami-accent">
          {count != null ? `${count.toLocaleString()} on the list today` : ''}
        </span>
        <span className="text-gray-600">{formatGoalCompact()}</span>
      </div>
    </div>
  );
}
