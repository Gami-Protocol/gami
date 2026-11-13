/**
 * XP progression math and persistence. Points only — no token or fiat payout
 * surface here; "rewarding distribution" means the leaderboard split below,
 * not a financial settlement path.
 */

const STORAGE_KEY = 'nova.xp.v1';
const BASE_XP_PER_LEVEL = 120;
const LEVEL_GROWTH = 1.18;

export interface XpState {
  totalXp: number;
  messageCount: number;
  streakDays: number;
  lastActiveDay: string | null;
}

export function loadXpState(): XpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as XpState;
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveXpState(state: XpState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, etc.) — XP just won't persist.
  }
}

function defaultState(): XpState {
  return { totalXp: 0, messageCount: 0, streakDays: 0, lastActiveDay: null };
}

/** XP required to go from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return Math.round(BASE_XP_PER_LEVEL * Math.pow(LEVEL_GROWTH, level - 1));
}

export function levelFromXp(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  let level = 1;
  let remaining = totalXp;
  let needed = xpForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: needed };
}

/** XP a single chat turn is worth. Longer, more thoughtful turns earn a touch more. */
export function xpForMessage(text: string): number {
  const base = 8;
  const lengthBonus = Math.min(12, Math.floor(text.trim().length / 40));
  const questBonus = /\bquest|mission|daily\b/i.test(text) ? 5 : 0;
  return base + lengthBonus + questBonus;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
