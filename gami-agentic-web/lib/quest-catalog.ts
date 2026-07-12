import type { SbtBadge, QuestTemplate } from '@/lib/types/agentic-quest';

export const SBT_BADGES: SbtBadge[] = [
  { id: 'starter', label: 'Starter', icon: 'sparkles', unlockXp: 0 },
  { id: 'fitness-initiate', label: 'Fitness Initiate', icon: 'dumbbell', unlockXp: 250 },
  { id: 'shopper', label: 'Shopper', icon: 'shopping-bag', unlockXp: 500 },
  { id: 'streak-7', label: '7-Day Streak', icon: 'flame', unlockXp: 750 },
  { id: 'holder', label: 'Holder', icon: 'gem', unlockXp: 1000 },
  { id: 'verified', label: 'Verified', icon: 'shield-check', unlockXp: 1200 },
  { id: 'legend', label: 'Legend', icon: 'star', unlockXp: 2500 },
];

export const QUEST_TEMPLATES: Record<string, QuestTemplate> = {
  fitness: {
    category: 'fitness',
    title: 'Fitness Streak',
    xpReward: 250,
    badgeId: 'fitness-initiate',
  },
  workout: {
    category: 'fitness',
    title: 'Workout Warrior',
    xpReward: 300,
    badgeId: 'fitness-initiate',
  },
  shopping: {
    category: 'shopping',
    title: 'Smart Shopper Quest',
    xpReward: 200,
    badgeId: 'shopper',
  },
  purchase: {
    category: 'shopping',
    title: 'Purchase Challenge',
    xpReward: 220,
    badgeId: 'shopper',
  },
  learning: {
    category: 'learning',
    title: 'Knowledge Seeker',
    xpReward: 180,
    badgeId: 'starter',
  },
  default: {
    category: 'general',
    title: 'Gami Campaign',
    xpReward: 250,
    badgeId: 'starter',
  },
};

export function badgesForXp(totalXp: number, currentIds: string[]): string[] {
  const unlocked = SBT_BADGES.filter((b) => totalXp >= b.unlockXp).map((b) => b.id);
  return [...new Set([...currentIds, ...unlocked])];
}

export function badgeById(id: string): SbtBadge | undefined {
  return SBT_BADGES.find((b) => b.id === id);
}
