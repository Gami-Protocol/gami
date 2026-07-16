import { resolveIntent } from '@/lib/intent-orchestrator';
import {
  appendLedger,
  checkRateLimit,
  checkSpam,
  getSession,
  syncLevel,
  upsertSession,
} from '@/lib/mock-session-store';
import type { AgenticChatResponse } from '@/lib/types/agentic-quest';

export type ProcessQuestError = {
  ok: false;
  error: string;
  code: string;
  status: number;
  retryAfterMs?: number;
};

export type ProcessQuestSuccess = {
  ok: true;
  data: AgenticChatResponse;
};

export type ProcessQuestResult = ProcessQuestSuccess | ProcessQuestError;

export async function processQuestMessage(input: {
  sessionId: string;
  latestUserMessage: string;
}): Promise<ProcessQuestResult> {
  const { sessionId, latestUserMessage } = input;

  const rate = checkRateLimit(sessionId);
  if (!rate.ok) {
    return {
      ok: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMITED',
      status: 429,
      retryAfterMs: rate.retryAfterMs,
    };
  }

  const spam = checkSpam(sessionId, latestUserMessage);
  if (!spam.ok) {
    return {
      ok: false,
      error: spam.reason,
      code: 'ANTI_ABUSE',
      status: 429,
    };
  }

  const session = syncLevel(getSession(sessionId));
  const { session: updatedSession, response } = await resolveIntent(latestUserMessage, session);
  upsertSession(syncLevel(updatedSession));

  const ledger = appendLedger(sessionId, {
    action: response.stateAction,
    questId: response.questDetails?.quest?.id,
    xp: response.questDetails?.xpGained ?? 0,
    message: latestUserMessage.slice(0, 200),
  });

  return {
    ok: true,
    data: {
      ...response,
      ledgerEntryId: ledger.id,
    },
  };
}
