import { type NovaTone } from '@/lib/config';
import { statsFromXP } from '@/lib/gami-sdk';
import { useOnboardingStore } from '@/lib/store';

export interface ChatMessage {
  id: string;
  role: 'nova' | 'user';
  text: string;
}

const TONE_OPENER: Record<NovaTone, string> = {
  shy: 'hey... i can help if you want. what do you need?',
  chill: "yo. i'm your wallet's brain. ask me anything — quests, balances, sending, the lot.",
  hype: "LET'S GOOO 🚀 I'm NOVA, your wallet's brain. What are we stacking today?!",
};

/** NOVA's opening line, tuned to the chosen tone. */
export function novaOpener(): string {
  const tone = useOnboardingStore.getState().novaTone;
  return TONE_OPENER[tone];
}

/** Suggestion chips shown under the chat. */
export const NOVA_SUGGESTIONS = [
  "What's my level?",
  'Find me a quest',
  "What's my $GAMI balance?",
  'How do I earn XP?',
];

/**
 * Scripted NOVA brain. Reads real wallet state from the store and answers with
 * a rule-based response (no network). The real Anthropic-backed NOVA drops in
 * behind this same signature later.
 */
export function novaReply(input: string): string {
  const q = input.toLowerCase().trim();
  const state = useOnboardingStore.getState();
  const stats = statsFromXP(state.xp);
  const tone = state.novaTone;
  const bang = tone === 'hype' ? '!' : '.';

  if (/(level|lvl|rank)/.test(q)) {
    return `You're level ${stats.level} with ${stats.totalXP.toLocaleString()} XP${bang} ${stats.xpToNextLevel.toLocaleString()} XP to level ${stats.level + 1}. Rank #${stats.rank.toLocaleString()}.`;
  }
  if (/(balance|gami|how much|wallet worth)/.test(q)) {
    return `Your $GAMI balance is ${stats.gamiBalance.toFixed(2)}, plus ${stats.points.toLocaleString()} soulbound Points (those can't be sold — only spent in-protocol)${bang}`;
  }
  if (/(quest|earn|xp|reward|stack)/.test(q)) {
    return `Head to the Quests tab — I tuned a few to your vibe${bang} "First Swap" pays +500 XP and takes ~5 min. Want me to walk you through it?`;
  }
  if (/(send|transfer|pay)/.test(q)) {
    return `I can prep a send for you. Tell me the amount and who to — I'll build it, you sign with Face ID. Nothing leaves without your approval${bang}`;
  }
  if (/(point|soulbound)/.test(q)) {
    return `Universal Points are soulbound — non-transferable XP. You earn them on every action and redeem them for coupons, tiers, and NFTs${bang}`;
  }
  if (/(hi|hey|hello|sup|yo)/.test(q)) {
    return TONE_OPENER[tone];
  }
  if (/(thank|thanks|ty|cheers)/.test(q)) {
    return tone === 'hype' ? 'ANYTIME 🔥 go stack more XP!' : 'anytime. go stack some XP.';
  }
  return `Good question${bang} I can check your level, balances, find quests, or prep a send. Try one of the suggestions below, or ask away.`;
}
