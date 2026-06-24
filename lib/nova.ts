import { type NovaTone } from '@/lib/config';
import { currentStats } from '@/lib/gami-sdk';
import { useOnboardingStore } from '@/lib/store';
import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { INTERESTS } from '@/lib/config';

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
 * Scripted NOVA brain (offline fallback). Reads real wallet state from the
 * store and answers with a rule-based response — used if the live Claude
 * call fails or the backend is unreachable.
 */
export function novaReply(input: string): string {
  const q = input.toLowerCase().trim();
  const state = useOnboardingStore.getState();
  const stats = currentStats();
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

interface LiveTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Build the wallet context payload sent to the Edge Function. */
function buildContext() {
  const state = useOnboardingStore.getState();
  const stats = currentStats();
  const interestLabels = state.interests
    .map((id) => INTERESTS.find((i) => i.id === id)?.label ?? id)
    .slice(0, 12);
  return {
    handle: state.handle || undefined,
    level: stats.level,
    totalXP: stats.totalXP,
    xpToNextLevel: stats.xpToNextLevel,
    gamiBalance: stats.gamiBalance,
    points: stats.points,
    rank: stats.rank,
    interests: interestLabels,
  };
}

/**
 * Live NOVA reply via the `nova-chat` Supabase Edge Function (Anthropic Claude).
 * Falls back to the scripted {@link novaReply} on any error so the chat never
 * dead-ends. `history` is the prior conversation (excluding the new input).
 */
export async function novaReplyLive(input: string, history: ChatMessage[]): Promise<string> {
  const tone = useOnboardingStore.getState().novaTone;

  if (!FUNCTIONS_URL) return novaReply(input);

  const turns: LiveTurn[] = history
    .filter((m) => m.text.trim().length > 0)
    .map((m) => ({ role: m.role === 'nova' ? 'assistant' : 'user', content: m.text }));
  turns.push({ role: 'user', content: input });

  try {
    const res = await fetch(`${FUNCTIONS_URL}/nova-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ messages: turns, tone, context: buildContext() }),
    });

    if (!res.ok) return novaReply(input);

    const data: unknown = await res.json();
    let reply = '';
    if (typeof data === 'object' && data !== null && 'reply' in data) {
      const raw = (data as Record<'reply', unknown>).reply;
      if (typeof raw === 'string') reply = raw.trim();
    }
    return reply.length > 0 ? reply : novaReply(input);
  } catch {
    return novaReply(input);
  }
}
