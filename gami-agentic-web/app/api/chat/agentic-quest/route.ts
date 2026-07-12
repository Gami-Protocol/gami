import { z } from 'zod';

import { resolveIntent } from '@/lib/intent-orchestrator';
import {
  appendLedger,
  checkRateLimit,
  checkSpam,
  getSession,
  isValidPartnerKey,
  syncLevel,
  upsertSession,
} from '@/lib/mock-session-store';
import type { AgenticChatResponse } from '@/lib/types/agentic-quest';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-partner-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const requestSchema = z.object({
  sessionId: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),
  latestUserMessage: z.string().min(1).max(2000),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .max(50)
    .optional(),
});

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const partnerKey = request.headers.get('x-partner-key');
    if (!isValidPartnerKey(partnerKey)) {
      return json({ error: 'Invalid or missing partner key', code: 'UNAUTHORIZED' }, 401);
    }

    const raw = await request.text();
    if (raw.length > 16_000) {
      return json({ error: 'Payload too large', code: 'PAYLOAD_TOO_LARGE' }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400);
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: 'Schema validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        400,
      );
    }

    const { sessionId, latestUserMessage } = parsed.data;

    const rate = checkRateLimit(sessionId);
    if (!rate.ok) {
      return json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED', retryAfterMs: rate.retryAfterMs },
        429,
        { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) },
      );
    }

    const spam = checkSpam(sessionId, latestUserMessage);
    if (!spam.ok) {
      return json({ error: spam.reason, code: 'ANTI_ABUSE' }, 429);
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

    const payload: AgenticChatResponse = {
      ...response,
      ledgerEntryId: ledger.id,
    };

    return json(payload, 200);
  } catch (err) {
    console.error('[agentic-quest]', err);
    return json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
  }
}

function json(data: unknown, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}
