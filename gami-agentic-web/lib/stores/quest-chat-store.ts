'use client';

import { create } from 'zustand';

import { sendAgenticMessage, AgenticApiError } from '@/lib/api/agentic-quest-client';
import { statsFromXP } from '@/lib/quest-math';
import type { ChatMessage, QuestDelta, QuestProfile } from '@/lib/types/agentic-quest';

let messageSeq = 0;
const nextMessageId = () => `msg_${++messageSeq}`;

export interface MilestoneEvent {
  type: 'level_up' | 'quest_completed' | 'quest_created';
  title: string;
  subtitle: string;
  xpGained?: number;
}

interface QuestChatState {
  sessionId: string;
  messages: ChatMessage[];
  questProfiles: QuestProfile[];
  totalXp: number;
  level: number;
  xpProgress: number;
  unlockedBadges: string[];
  isLoading: boolean;
  error: string | null;
  milestone: MilestoneEvent | null;
  initSession: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
  dismissMilestone: () => void;
  applyDelta: (delta: QuestDelta) => void;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr_session';
  const key = 'gami-agentic-session';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = `sess_${crypto.randomUUID().slice(0, 12)}`;
  sessionStorage.setItem(key, id);
  return id;
}

const opener: ChatMessage = {
  id: 'opener',
  role: 'assistant',
  content:
    'Gami Agent Layer online. I orchestrate quests, verify milestones, and anchor soulbound XP. Try "I want a fitness quest" or ask "what quests do I have?"',
};

export const useQuestChatStore = create<QuestChatState>((set, get) => ({
  sessionId: 'pending',
  messages: [opener],
  questProfiles: [],
  totalXp: 0,
  level: 0,
  xpProgress: 0,
  unlockedBadges: ['starter'],
  isLoading: false,
  error: null,
  milestone: null,

  initSession: () => {
    const sessionId = getOrCreateSessionId();
    set({ sessionId });
  },

  clearError: () => set({ error: null }),

  dismissMilestone: () => set({ milestone: null }),

  applyDelta: (delta) => {
    const prevLevel = get().level;
    const totalXp = delta.totalXp ?? get().totalXp;
    const stats = statsFromXP(totalXp);
    const questProfiles = delta.quest
      ? get().questProfiles.some((q) => q.id === delta.quest!.id)
        ? get().questProfiles.map((q) => (q.id === delta.quest!.id ? delta.quest! : q))
        : [delta.quest, ...get().questProfiles]
      : get().questProfiles;

    let milestone: MilestoneEvent | null = null;

    if (delta.action === 'CREATED' && delta.quest) {
      milestone = {
        type: 'quest_created',
        title: 'New Quest Forged',
        subtitle: delta.quest.title,
      };
    } else if (delta.action === 'COMPLETED' && delta.quest) {
      milestone = {
        type: 'quest_completed',
        title: 'Milestone Cleared',
        subtitle: delta.quest.title,
        xpGained: delta.xpGained,
      };
    }

    if (stats.level > prevLevel) {
      milestone = {
        type: 'level_up',
        title: 'Level Up',
        subtitle: `You reached Level ${stats.level}`,
        xpGained: delta.xpGained,
      };
    }

    set({
      questProfiles,
      totalXp,
      level: stats.level,
      xpProgress: stats.progress,
      unlockedBadges: delta.unlockedBadgeIds ?? get().unlockedBadges,
      milestone,
    });
  },

  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().isLoading) return;

    const userMsg: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      content: trimmed,
    };

    const assistantPlaceholder: ChatMessage = {
      id: nextMessageId(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    set((s) => ({
      messages: [...s.messages, userMsg, assistantPlaceholder],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await sendAgenticMessage({
        sessionId: get().sessionId,
        latestUserMessage: trimmed,
        messages: get()
          .messages.filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content })),
      });

      if (response.questDetails) {
        get().applyDelta(response.questDetails);
      }

      const fullText = response.reply.replace(/\*\*/g, '');
      const maxDuration = 900;
      const interval = Math.min(18, Math.floor(maxDuration / Math.max(fullText.length, 1)));

      for (let i = 0; i <= fullText.length; i++) {
        await new Promise((r) => setTimeout(r, interval));
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantPlaceholder.id
              ? {
                  ...m,
                  content: fullText.slice(0, i),
                  isStreaming: i < fullText.length,
                  stateAction: response.stateAction,
                }
              : m,
          ),
        }));
      }

      set({ isLoading: false });
    } catch (err) {
      const message =
        err instanceof AgenticApiError
          ? `${err.message} (${err.code})`
          : 'Network error — could not reach the Agent Layer.';

      set((s) => ({
        isLoading: false,
        error: message,
        messages: s.messages.filter((m) => m.id !== assistantPlaceholder.id),
      }));
    }
  },
}));
