import { type NovaTone } from '@/lib/config';
import { getActiveChain } from '@/lib/chain';
import { currentStats, fetchStatsForAddress } from '@/lib/gami-sdk';
import { isNovaAgentId, type NovaAgentId } from '@/lib/nova-agents';
import {
  isNovaProposal,
  type NovaProposal,
  type NovaToolTrace,
} from '@/lib/nova-tools';
import { useOnboardingStore } from '@/lib/store';
import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { INTERESTS } from '@/lib/config';

export interface ChatMessage {
  id: string;
  role: 'nova' | 'user';
  text: string;
  agentId?: NovaAgentId;
  trace?: NovaToolTrace[];
  proposal?: NovaProposal;
}

export interface NovaReplyResult {
  reply: string;
  activeAgent: NovaAgentId;
  trace: NovaToolTrace[];
  proposal?: NovaProposal;
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

/** Build public wallet context. Signing credentials never leave Privy. */
async function buildContext() {
  const state = useOnboardingStore.getState();
  const walletAddress = state.walletAddress ?? undefined;
  const stats = await fetchStatsForAddress(walletAddress ?? null);
  const interestLabels = state.interests
    .map((id) => INTERESTS.find((i) => i.id === id)?.label ?? id)
    .slice(0, 12);
  return {
    walletAddress,
    chain: getActiveChain(),
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

function fallbackAgent(input: string): NovaAgentId {
  if (/(quest|xp|reward|earn)/i.test(input)) return 'quests';
  if (/(token|gami|sale|tge|airdrop|governance|allocation)/i.test(input)) return 'tokenomics';
  return 'wallet';
}

function fallbackResult(input: string): NovaReplyResult {
  return { reply: novaReply(input), activeAgent: fallbackAgent(input), trace: [] };
}

/**
 * Live NOVA reply via the `nova-chat` Supabase Edge Function (Anthropic Claude).
 * Falls back to the scripted {@link novaReply} on any error so the chat never
 * dead-ends. `history` is the prior conversation (excluding the new input).
 */
export async function novaReplyLive(
  input: string,
  history: ChatMessage[],
): Promise<NovaReplyResult> {
  const tone = useOnboardingStore.getState().novaTone;

  if (!FUNCTIONS_URL) return fallbackResult(input);

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
      body: JSON.stringify({ messages: turns, tone, context: await buildContext() }),
    });

    if (!res.ok) return fallbackResult(input);

    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') return fallbackResult(input);
    const raw = data as Record<string, unknown>;
    const reply = typeof raw.reply === 'string' ? raw.reply.trim() : '';
    if (!reply || !isNovaAgentId(raw.activeAgent)) return fallbackResult(input);
    const trace = Array.isArray(raw.trace)
      ? raw.trace.filter(
          (entry): entry is NovaToolTrace =>
            Boolean(
              entry &&
                typeof entry === 'object' &&
                typeof (entry as NovaToolTrace).toolId === 'string' &&
                typeof (entry as NovaToolTrace).label === 'string',
            ),
        )
      : [];
    return {
      reply,
      activeAgent: raw.activeAgent,
      trace,
      proposal: isNovaProposal(raw.proposal) ? raw.proposal : undefined,
    };
  } catch {
    return fallbackResult(input);
  }
}
