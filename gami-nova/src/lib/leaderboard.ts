/**
 * Mock reward-distribution data: a points leaderboard. "You" is spliced in
 * live based on current XP. No token/USDC amounts — points only, so this
 * stays clear of the sale/payout compliance surface on the main site.
 */

export interface LeaderboardEntry {
  name: string;
  xp: number;
  isYou?: boolean;
}

const MOCK_PEERS: Omit<LeaderboardEntry, 'isYou'>[] = [
  { name: 'astra.base', xp: 4210 },
  { name: 'kujo', xp: 3620 },
  { name: 'ren_onchain', xp: 2990 },
  { name: 'ppk', xp: 2140 },
  { name: 'mina', xp: 1580 },
  { name: 'dex', xp: 940 },
];

export function buildLeaderboard(yourXp: number): LeaderboardEntry[] {
  const all: LeaderboardEntry[] = [...MOCK_PEERS, { name: 'you', xp: yourXp, isYou: true }];
  return all.sort((a, b) => b.xp - a.xp);
}

/** Share of a fixed weekly points pool, proportional to XP. Display-only. */
export function rewardShare(entry: LeaderboardEntry, all: LeaderboardEntry[]): number {
  const total = all.reduce((sum, e) => sum + e.xp, 0);
  if (total === 0) return 0;
  return entry.xp / total;
}
