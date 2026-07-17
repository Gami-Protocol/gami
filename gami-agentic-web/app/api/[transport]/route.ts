import { createMcpHandler } from 'mcp-handler';

import { registerAgenticQuestTools } from '@/lib/mcp/register-tools';
import { isValidPartnerKey } from '@/lib/mock-session-store';

export const runtime = 'nodejs';
export const maxDuration = 60;

const mcpHandler = createMcpHandler(
  (server) => {
    registerAgenticQuestTools(server);
  },
  {
    serverInfo: {
      name: 'gami-agentic-quest',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api',
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === 'development',
  },
);

function resolvePartnerKey(request: Request): string | null {
  const headerKey = request.headers.get('x-partner-key');
  if (headerKey) return headerKey;

  const auth = request.headers.get('authorization');
  if (!auth) return null;

  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  return bearer?.[1]?.trim() ?? null;
}

async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, authorization, x-partner-key, mcp-session-id, accept',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      },
    });
  }

  const partnerKey = resolvePartnerKey(request);
  if (!isValidPartnerKey(partnerKey)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing partner key', code: 'UNAUTHORIZED' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }

  return mcpHandler(request);
}

export { handler as GET, handler as POST, handler as DELETE, handler as OPTIONS };
