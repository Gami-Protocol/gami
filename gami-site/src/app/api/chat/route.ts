import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { GAMI_KNOWLEDGE } from '@/content/knowledge';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: 'AI is not configured. Set OPENAI_API_KEY to enable Ask Gami AI.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await req.json();
  const messages = (body.messages || []) as Array<{ role: 'user' | 'assistant'; content: string }>;

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
    system: `You are Gami AI, the onboarding assistant for Gami Protocol.
Be concise, premium, and helpful. Use markdown when useful.
If something is proposed/not finalized, say so clearly.
Ground answers in this knowledge base:\n\n${GAMI_KNOWLEDGE}`,
    messages,
  });

  return result.toTextStreamResponse();
}
