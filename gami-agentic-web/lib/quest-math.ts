export interface LevelStats {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  xpThisLevel: number;
  progress: number;
}

export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return 500 * level + 250 * level * (level - 1);
}

export function levelForXP(totalXP: number): number {
  let level = 0;
  while (xpForLevel(level + 1) <= totalXP) level += 1;
  return level;
}

export function statsFromXP(totalXP: number): LevelStats {
  const level = levelForXP(totalXP);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor || 1;
  const xpThisLevel = totalXP - floor;

  return {
    level,
    totalXP,
    xpToNextLevel: Math.max(0, ceil - totalXP),
    xpThisLevel,
    progress: Math.min(1, xpThisLevel / span),
  };
}
