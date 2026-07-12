import { badgesForXp, QUEST_TEMPLATES } from '@/lib/quest-catalog';
import { levelForXP } from '@/lib/quest-math';
import type {
  AgenticChatResponse,
  QuestDelta,
  QuestProfile,
  QuestStateAction,
  SessionState,
} from '@/lib/types/agentic-quest';
import { delay } from '@/lib/mock-session-store';

function questId(): string {
  return `qst_${crypto.randomUUID().slice(0, 8)}`;
}

function detectCategory(message: string): string {
  const lower = message.toLowerCase();
  if (/(fitness|workout|gym|run|exercise)/i.test(lower)) return 'fitness';
  if (/(shop|shopping|purchase|buy|store)/i.test(lower)) return 'shopping';
  if (/(learn|study|course|read)/i.test(lower)) return 'learning';
  return 'default';
}

function isCreateIntent(message: string): boolean {
  return /(want.*quest|start.*campaign|new quest|begin.*quest|create.*quest|fitness quest|shopping quest)/i.test(
    message,
  );
}

function isVerifyIntent(message: string): boolean {
  return /(finished|completed|did my|verified|i did|purchase complete|workout done|finished my)/i.test(message);
}

function isStatusIntent(message: string): boolean {
  return /(what quest|my quest|active quest|how am i|status|progress)/i.test(message);
}

function activeQuest(session: SessionState): QuestProfile | undefined {
  return session.questProfiles.find((q) => q.status !== 'completed');
}

function createQuest(session: SessionState, message: string): { session: SessionState; delta: QuestDelta; reply: string } {
  const category = detectCategory(message);
  const template = QUEST_TEMPLATES[category] ?? QUEST_TEMPLATES.default;

  const quest: QuestProfile = {
    id: questId(),
    title: template.title,
    category: template.category,
    status: 'active',
    progress: 0,
    xpReward: template.xpReward,
    earnedXp: 0,
    sbtBadgeId: template.badgeId,
    createdAt: new Date().toISOString(),
  };

  const updated: SessionState = {
    ...session,
    questProfiles: [quest, ...session.questProfiles],
  };

  const delta: QuestDelta = {
    action: 'CREATED',
    quest,
    totalXp: updated.totalXp,
    level: updated.level,
    unlockedBadgeIds: updated.unlockedBadgeIds,
  };

  const reply = `Quest forged: **${quest.title}**. Your ${quest.category} campaign is live — complete milestones to earn ${quest.xpReward} soulbound XP and unlock your SBT badge.`;

  return { session: updated, delta, reply };
}

function updateProgress(
  session: SessionState,
  quest: QuestProfile,
): { session: SessionState; delta: QuestDelta; reply: string; action: QuestStateAction } {
  const previousProgress = quest.progress;
  const bump = quest.category === 'fitness' ? 50 : 35;
  const nextProgress = Math.min(100, quest.progress + bump);

  if (nextProgress >= 100) {
    const xpGained = quest.xpReward;
    const totalXp = session.totalXp + xpGained;
    const unlockedBadgeIds = badgesForXp(totalXp, session.unlockedBadgeIds);
    const completed: QuestProfile = {
      ...quest,
      status: 'completed',
      progress: 100,
      earnedXp: xpGained,
    };

    const profiles = session.questProfiles.map((q) => (q.id === quest.id ? completed : q));
    const updated: SessionState = {
      ...session,
      totalXp,
      level: levelForXP(totalXp),
      questProfiles: profiles,
      unlockedBadgeIds,
    };

    const delta: QuestDelta = {
      action: 'COMPLETED',
      quest: completed,
      previousProgress,
      xpGained,
      totalXp,
      level: updated.level,
      unlockedBadgeIds,
    };

    const reply = `Milestone cleared! **${quest.title}** is complete. +${xpGained} soulbound XP secured. Your Gami Agent Layer has anchored this achievement.`;
    return { session: updated, delta, reply, action: 'COMPLETED' };
  }

  const inProgress: QuestProfile = {
    ...quest,
    status: 'in_progress',
    progress: nextProgress,
  };

  const profiles = session.questProfiles.map((q) => (q.id === quest.id ? inProgress : q));
  const updated: SessionState = { ...session, questProfiles: profiles };

  const delta: QuestDelta = {
    action: 'PROGRESS_UPDATED',
    quest: inProgress,
    previousProgress,
    totalXp: updated.totalXp,
    level: updated.level,
    unlockedBadgeIds: updated.unlockedBadgeIds,
  };

  const reply = `Progress logged on **${quest.title}** — now at ${nextProgress}%. Keep going to unlock ${quest.xpReward} XP.`;
  return { session: updated, delta, reply, action: 'PROGRESS_UPDATED' };
}

function fallbackReply(session: SessionState, message: string): string {
  const quest = activeQuest(session);
  if (isStatusIntent(message)) {
    if (!quest) {
      return 'No active campaigns yet. Tell me what you want to pursue — e.g. "I want a fitness quest" or "start a shopping campaign".';
    }
    return `Active quest: **${quest.title}** (${quest.progress}% complete, ${quest.xpReward} XP reward). Say "I finished my workout" or "I completed my purchase" to verify progress.`;
  }

  if (quest) {
    return `I'm tracking **${quest.title}** at ${quest.progress}%. You have ${session.totalXp} soulbound XP (Level ${session.level}). Want to verify progress or start a new campaign?`;
  }

  return `Gami Agent Layer online. You have ${session.totalXp} soulbound XP. Try "I want a fitness quest" to spawn a new campaign, or ask "what quests do I have?"`;
}

export async function resolveIntent(
  message: string,
  session: SessionState,
): Promise<{ session: SessionState; response: AgenticChatResponse }> {
  await delay(200 + Math.floor(Math.random() * 400));

  if (isCreateIntent(message)) {
    const { session: updated, delta, reply } = createQuest(session, message);
    return {
      session: updated,
      response: { reply, stateAction: 'CREATED', questDetails: delta },
    };
  }

  if (isVerifyIntent(message)) {
    const quest = activeQuest(session);
    if (!quest) {
      return {
        session,
        response: {
          reply: 'No active quest to verify. Start one first — e.g. "I want a fitness quest".',
          stateAction: 'NONE',
        },
      };
    }

    const { session: updated, delta, reply, action } = updateProgress(session, quest);
    return {
      session: updated,
      response: { reply, stateAction: action, questDetails: delta },
    };
  }

  return {
    session,
    response: {
      reply: fallbackReply(session, message),
      stateAction: 'NONE',
    },
  };
}
