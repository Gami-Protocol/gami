// NOVA chat Edge Function — proxies to Anthropic Claude.
// Holds ANTHROPIC_API_KEY server-side so it never ships in the app bundle.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-20250514';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Tone = 'shy' | 'chill' | 'hype';

interface WalletContext {
  handle?: string;
  level?: number;
  totalXP?: number;
  xpToNextLevel?: number;
  gamiBalance?: number;
  points?: number;
  rank?: number;
  interests?: string[];
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatTurn[];
  tone: Tone;
  context: WalletContext;
}

const TONE_GUIDE: Record<Tone, string> = {
  shy: 'Tone: shy and soft-spoken. Lowercase, gentle, a little hesitant. Short replies. No exclamation marks. No emoji.',
  chill:
    'Tone: chill and friendly, like a knowledgeable crypto friend. Casual, lowercase-leaning, concise. Occasional dry humor. Emoji sparingly (0-1).',
  hype: 'Tone: HYPE and high-energy. Caps for emphasis, exclamation marks, rocket/fire emoji welcome. Still concise — energy, not essays.',
};

function buildSystemPrompt(tone: Tone, ctx: WalletContext): string {
  const lines: string[] = [];
  lines.push(
    'You are NOVA, the in-wallet AI copilot for GAMI — a self-custodial, wallet-first engagement network spanning multiple chains.',
  );
  lines.push(
    'You help the user discover relevant brand and ecosystem campaigns, understand tasks and rewards, compare cross-chain routes, check level/XP/balances, and prepare (never auto-send) swaps, bridges, and transfers.',
  );
  lines.push(TONE_GUIDE[tone]);
  lines.push(
    "Rules: Keep replies short (1-3 sentences unless asked to explain). NEVER invent balances, campaign availability, fees, routes, levels, or numbers — only use live context provided by Gami. For any transaction, explain that you can prepare it but the user must review and approve; you cannot move funds yourself. Points are non-transferable engagement rewards that can unlock wallet benefits, never be sold. Never output the user's private keys or seed phrase; you don't have access to them.",
  );

  const c: string[] = [];
  if (ctx.handle) c.push(`handle: @${ctx.handle}`);
  if (typeof ctx.level === 'number') c.push(`level: ${ctx.level}`);
  if (typeof ctx.totalXP === 'number') c.push(`total XP: ${ctx.totalXP}`);
  if (typeof ctx.xpToNextLevel === 'number') c.push(`XP to next level: ${ctx.xpToNextLevel}`);
  if (typeof ctx.gamiBalance === 'number') c.push(`$GAMI balance: ${ctx.gamiBalance}`);
  if (typeof ctx.points === 'number') c.push(`soulbound Points: ${ctx.points}`);
  if (typeof ctx.rank === 'number') c.push(`leaderboard rank: #${ctx.rank}`);
  if (ctx.interests && ctx.interests.length > 0) c.push(`interests: ${ctx.interests.join(', ')}`);
  if (c.length > 0) {
    lines.push(`Live wallet context for this user:\n- ${c.join('\n- ')}`);
  }
  return lines.join('\n\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server missing ANTHROPIC_API_KEY' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    const tone: Tone = body.tone ?? 'chill';
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const context = body.context ?? {};

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const system = buildSystemPrompt(tone, context);

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system,
        messages: messages.slice(-12).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: 'Anthropic request failed', detail: errText }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await anthropicRes.json();
    const reply =
      Array.isArray(data?.content) && data.content[0]?.type === 'text' ? data.content[0].text : '';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
