import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { processQuestMessage } from '@/lib/mcp/process-quest-message';
import { getSession, syncLevel } from '@/lib/mock-session-store';

const sessionIdSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/);

const tenantIdSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-zA-Z0-9:_-]+$/);
const idempotencySchema = z
  .string()
  .min(8)
  .max(120)
  .regex(/^[a-zA-Z0-9:_-]+$/);

function toolResult(data: unknown, isError = false) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
    structuredContent:
      typeof data === 'object' && data !== null
        ? (data as Record<string, unknown>)
        : { value: data },
    isError,
  };
}

export function registerAgenticQuestTools(server: McpServer) {
  server.registerTool(
    'agentic_quest_chat',
    {
      title: 'Agentic Quest Chat',
      description:
        'Send a natural-language message to the Gami Agent Layer. Creates quests, verifies progress, and returns conversational replies with quest state.',
      inputSchema: {
        sessionId: sessionIdSchema.describe('Stable chat session id'),
        latestUserMessage: z.string().min(1).max(2000).describe('Latest user utterance'),
        tenantId: tenantIdSchema.optional().describe('Optional tenant key for scoped quotas'),
        appId: z
          .string()
          .min(2)
          .max(64)
          .regex(/^[a-zA-Z0-9:_-]+$/)
          .optional(),
        idempotencyKey: idempotencySchema
          .optional()
          .describe('Optional idempotency key to dedupe retries'),
        priority: z.enum(['high', 'normal', 'low']).optional(),
        messages: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string().max(4000),
            }),
          )
          .max(50)
          .optional()
          .describe('Optional recent conversation history'),
      },
    },
    async ({ sessionId, latestUserMessage, tenantId, appId, idempotencyKey, priority }) => {
      const result = await processQuestMessage({
        sessionId,
        latestUserMessage,
        tenantId,
        appId,
        idempotencyKey,
        priority,
      });
      if (!result.ok) {
        return toolResult(
          {
            error: result.error,
            code: result.code,
            retryAfterMs: result.retryAfterMs,
          },
          true,
        );
      }
      return toolResult(result.data);
    },
  );

  server.registerTool(
    'create_quest',
    {
      title: 'Create Quest',
      description:
        'Forge a new quest campaign from a short intent description (e.g. fitness, shopping, learning).',
      inputSchema: {
        sessionId: sessionIdSchema,
        intent: z.string().min(1).max(2000).describe('Quest intent, e.g. "I want a fitness quest"'),
        tenantId: tenantIdSchema.optional(),
        appId: z
          .string()
          .min(2)
          .max(64)
          .regex(/^[a-zA-Z0-9:_-]+$/)
          .optional(),
        idempotencyKey: idempotencySchema.optional(),
        priority: z.enum(['high', 'normal', 'low']).optional(),
      },
    },
    async ({ sessionId, intent, tenantId, appId, idempotencyKey, priority }) => {
      const message = /quest|campaign/i.test(intent) ? intent : `I want a ${intent} quest`;
      const result = await processQuestMessage({
        sessionId,
        latestUserMessage: message,
        tenantId,
        appId,
        idempotencyKey,
        priority,
      });
      if (!result.ok) {
        return toolResult({ error: result.error, code: result.code }, true);
      }
      return toolResult(result.data);
    },
  );

  server.registerTool(
    'verify_quest_progress',
    {
      title: 'Verify Quest Progress',
      description: 'Verify completion of the active quest and advance or settle XP.',
      inputSchema: {
        sessionId: sessionIdSchema,
        evidence: z
          .string()
          .min(1)
          .max(2000)
          .optional()
          .describe('Optional completion evidence phrase'),
        tenantId: tenantIdSchema.optional(),
        appId: z
          .string()
          .min(2)
          .max(64)
          .regex(/^[a-zA-Z0-9:_-]+$/)
          .optional(),
        idempotencyKey: idempotencySchema.optional(),
        priority: z.enum(['high', 'normal', 'low']).optional(),
      },
    },
    async ({ sessionId, evidence, tenantId, appId, idempotencyKey, priority }) => {
      const result = await processQuestMessage({
        sessionId,
        latestUserMessage: evidence?.trim() || 'I finished my workout',
        tenantId,
        appId,
        idempotencyKey,
        priority,
      });
      if (!result.ok) {
        return toolResult({ error: result.error, code: result.code }, true);
      }
      return toolResult(result.data);
    },
  );

  server.registerTool(
    'get_quest_status',
    {
      title: 'Get Quest Status',
      description: 'Return the current session XP, level, and active quest profiles.',
      inputSchema: {
        sessionId: sessionIdSchema,
      },
    },
    async ({ sessionId }) => {
      const session = syncLevel(getSession(sessionId));
      return toolResult({
        sessionId: session.sessionId,
        totalXp: session.totalXp,
        level: session.level,
        questProfiles: session.questProfiles,
        unlockedBadgeIds: session.unlockedBadgeIds,
      });
    },
  );
}
