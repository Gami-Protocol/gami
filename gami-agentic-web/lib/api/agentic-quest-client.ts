import type { AgenticChatRequest, AgenticChatResponse } from '@/lib/types/agentic-quest';

export class AgenticApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AgenticApiError';
  }
}

const PARTNER_KEY =
  process.env.NEXT_PUBLIC_GAMI_PARTNER_KEY ?? 'dev-partner-key-gami-5144';

export async function sendAgenticMessage(
  payload: AgenticChatRequest,
): Promise<AgenticChatResponse> {
  const res = await fetch('/api/chat/agentic-quest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-partner-key': PARTNER_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as AgenticChatResponse & { error?: string; code?: string };

  if (!res.ok) {
    throw new AgenticApiError(
      data.error ?? 'Request failed',
      data.code ?? 'UNKNOWN',
      res.status,
    );
  }

  return data;
}
