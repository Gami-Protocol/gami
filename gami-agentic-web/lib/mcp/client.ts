import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import type { AgenticChatRequest, AgenticChatResponse } from '@/lib/types/agentic-quest';

export class AgenticMcpError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
  ) {
    super(message);
    this.name = 'AgenticMcpError';
  }
}

const PARTNER_KEY =
  process.env.NEXT_PUBLIC_GAMI_PARTNER_KEY ?? 'dev-partner-key-gami-5144';

function mcpEndpoint(): URL {
  if (typeof window !== 'undefined') {
    return new URL('/api/mcp', window.location.origin);
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3010';
  return new URL('/api/mcp', base);
}

function parseToolPayload(result: unknown): { data: Record<string, unknown>; isError: boolean } {
  const record = (result ?? {}) as {
    isError?: boolean;
    content?: Array<{ type: string; text?: string }>;
    structuredContent?: unknown;
  };

  if (record.structuredContent && typeof record.structuredContent === 'object') {
    return {
      data: record.structuredContent as Record<string, unknown>,
      isError: Boolean(record.isError),
    };
  }

  const text = record.content?.find((part) => part.type === 'text' && part.text)?.text;
  if (!text) {
    throw new AgenticMcpError('Empty MCP tool response', 'EMPTY_RESPONSE');
  }

  try {
    return {
      data: JSON.parse(text) as Record<string, unknown>,
      isError: Boolean(record.isError),
    };
  } catch {
    throw new AgenticMcpError('Invalid MCP tool JSON', 'INVALID_RESPONSE');
  }
}

export async function sendAgenticMessage(
  payload: AgenticChatRequest,
): Promise<AgenticChatResponse> {
  const transport = new StreamableHTTPClientTransport(mcpEndpoint(), {
    requestInit: {
      headers: {
        'x-partner-key': PARTNER_KEY,
        Authorization: `Bearer ${PARTNER_KEY}`,
      },
    },
  });

  const client = new Client({
    name: 'gami-agentic-quest-client',
    version: '1.0.0',
  });

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: 'agentic_quest_chat',
      arguments: {
        sessionId: payload.sessionId,
        latestUserMessage: payload.latestUserMessage,
        messages: payload.messages,
      },
    });

    const { data, isError } = parseToolPayload(result);

    if (isError || data.error) {
      throw new AgenticMcpError(
        String(data.error ?? 'MCP tool failed'),
        String(data.code ?? 'TOOL_ERROR'),
        data.code === 'UNAUTHORIZED' ? 401 : data.code === 'RATE_LIMITED' ? 429 : 400,
      );
    }

    return data as unknown as AgenticChatResponse;
  } catch (err) {
    if (err instanceof AgenticMcpError) throw err;
    const message = err instanceof Error ? err.message : 'MCP client request failed';
    throw new AgenticMcpError(message, 'MCP_CLIENT_ERROR');
  } finally {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
  }
}
