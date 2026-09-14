/**
 * The waitlist target, and how it is allowed to be displayed.
 *
 * This is a goal, not a measurement. The site previously published figures that
 * read as measurements and were not — "5M+ target users", "100+ partner apps",
 * "15,402 EPS" — and removing them was part of the remediation. So the goal and
 * the live count are modelled as two different things here and must render as
 * two different things: the goal is always labelled as a goal, and the only
 * number ever presented as people who have signed up is the one the database
 * returns.
 *
 * If a real prior signup population exists somewhere else (an earlier list, an
 * export, another product's table), the honest way to include it is to import
 * those rows into public.waitlist so the live count covers them. Do not add a
 * constant offset here — it would make the counter say something no record
 * supports.
 */

/** Signups the waitlist is aiming for. A target, never rendered as a count. */
export const WAITLIST_GOAL = 10_000_000;

/** "10,000,000" — for copy that states the target explicitly. */
export function formatGoal(goal: number = WAITLIST_GOAL): string {
  return goal.toLocaleString('en-US');
}

/** "10M" — for tight spaces such as a progress bar end-cap. */
export function formatGoalCompact(goal: number = WAITLIST_GOAL): string {
  if (goal >= 1_000_000) return `${goal / 1_000_000}M`;
  if (goal >= 1_000) return `${goal / 1_000}K`;
  return String(goal);
}

/**
 * Progress toward the goal, clamped to 0–100.
 *
 * Early on this is a fraction of a percent, which is the true picture. The bar
 * below keeps a hairline visible so the component does not look broken, but the
 * percentage returned here is never rounded up to flatter it.
 */
export function goalProgress(count: number, goal: number = WAITLIST_GOAL): number {
  if (!Number.isFinite(count) || count <= 0 || goal <= 0) return 0;
  return Math.min(100, (count / goal) * 100);
}

/**
 * Width for a progress bar: the real percentage, with a 0.5% floor once there
 * is at least one signup so a nonzero count is still visible on screen.
 * Presentation only — never use this as the reported figure.
 */
export function goalBarWidth(count: number, goal: number = WAITLIST_GOAL): string {
  const pct = goalProgress(count, goal);
  if (pct === 0) return '0%';
  return `${Math.max(0.5, pct)}%`;
}
