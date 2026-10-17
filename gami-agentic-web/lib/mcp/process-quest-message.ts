import { resolveIntent } from '@/lib/intent-orchestrator';
import {
  appendLedger,
  checkRateLimit,
  checkSpam,
  getSession,
  syncLevel,
  upsertSession,
} from '@/lib/mock-session-store';
import { buildIdempotencyKey, getAgentTaskManager, TaskRejectedError } from '@/lib/scalability';
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
  tenantId?: string;
  appId?: string;
  idempotencyKey?: string;
  priority?: 'high' | 'normal' | 'low';
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

  try {
    const manager = getAgentTaskManager();
    const idempotencyKey = buildIdempotencyKey({
      sessionId,
      message: latestUserMessage,
      idempotencyKey: input.idempotencyKey,
    });

    const job = await manager.enqueue<AgenticChatResponse>({
      tenantId: input.tenantId ?? 'default',
      appId: input.appId ?? 'agentic-web',
      idempotencyKey,
      priority: input.priority ?? 'normal',
      execute: async () => {
        const session = syncLevel(getSession(sessionId));
        const { session: updatedSession, response } = await resolveIntent(
          latestUserMessage,
          session,
        );
        upsertSession(syncLevel(updatedSession));

        const ledger = appendLedger(sessionId, {
          action: response.stateAction,
          questId: response.questDetails?.quest?.id,
          xp: response.questDetails?.xpGained ?? 0,
          message: latestUserMessage.slice(0, 200),
        });

        return {
          ...response,
          ledgerEntryId: ledger.id,
        };
      },
    });

    return {
      ok: true,
      data: await job.promise,
    };
  } catch (error) {
    if (error instanceof TaskRejectedError) {
      if (error.code === 'RATE_LIMITED') {
        return {
          ok: false,
          error: 'Tenant rate limit exceeded',
          code: 'RATE_LIMITED',
          status: 429,
          retryAfterMs: error.retryAfterMs,
        };
      }
      return {
        ok: false,
        error: error.code === 'BACKPRESSURE' ? 'Agent queue is saturated' : 'Quota exceeded',
        code: error.code,
        status: error.code === 'BACKPRESSURE' ? 503 : 429,
      };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected processing error',
      code: 'PROCESSING_ERROR',
      status: 500,
    };
  }
}
