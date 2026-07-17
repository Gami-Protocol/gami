import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOOL_ROUNDS = 3;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Tone = 'shy' | 'chill' | 'hype';
type AgentId = 'wallet' | 'quests' | 'tokenomics';
type ChainId = 'base' | 'baseSepolia';
type ToolId =
  | 'wallet_overview'
  | 'find_quests'
  | 'sale_status'
  | 'tokenomics'
  | 'prepare_gami_transfer'
  | 'prepare_gami_claim';

interface WalletContext {
  walletAddress?: string;
  chain?: ChainId;
  handle?: string;
  level?: number;
  totalXP?: number;
  xpToNextLevel?: number;
  gamiBalance?: number;
  claimableGami?: number;
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

interface ToolUse {
  type: 'tool_use';
  id: string;
  name: ToolId;
  input: Record<string, unknown>;
}

const AGENT_TOOLS: Record<AgentId, readonly ToolId[]> = {
  wallet: ['wallet_overview', 'prepare_gami_transfer', 'prepare_gami_claim'],
  quests: ['find_quests'],
  tokenomics: ['sale_status', 'tokenomics'],
};

const TOOL_LABELS: Record<ToolId, string> = {
  wallet_overview: 'Checked wallet balances',
  find_quests: 'Found matching quests',
  sale_status: 'Checked token raise',
  tokenomics: 'Reviewed GAMI tokenomics',
  prepare_gami_transfer: 'Prepared GAMI transfer',
  prepare_gami_claim: 'Prepared vested-token claim',
};
const TOOL_IDS = Object.keys(TOOL_LABELS) as ToolId[];

const TOOLS = [
  {
    name: 'wallet_overview',
    description: "Read the connected user's public wallet balances, XP, level, and claimable GAMI.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'find_quests',
    description: 'Find current quests that match the user and award XP.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sale_status',
    description: 'Read current public GAMI token raise statistics.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'tokenomics',
    description:
      'Read the published GAMI utility, allocation, TGE, airdrop, and risk-control plan.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'prepare_gami_transfer',
    description:
      'Prepare, but never sign, a GAMI transfer. Use only after the user provides an exact 0x recipient and amount.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Exact 20-byte 0x recipient address' },
        amount: { type: 'string', description: 'Positive decimal GAMI amount' },
      },
      required: ['to', 'amount'],
      additionalProperties: false,
    },
  },
  {
    name: 'prepare_gami_claim',
    description: 'Prepare, but never sign, a claim of vested GAMI.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
] as const;

const TONE_GUIDE: Record<Tone, string> = {
  shy: 'Tone: shy and soft-spoken. Lowercase, gentle, a little hesitant. Short replies. No exclamation marks. No emoji.',
  chill:
    'Tone: chill and friendly, like a knowledgeable crypto friend. Casual, lowercase-leaning, concise. Occasional dry humor. Emoji sparingly (0-1).',
  hype: 'Tone: HYPE and high-energy. Caps for emphasis, exclamation marks, rocket/fire emoji welcome. Still concise — energy, not essays.',
};

function routeAgent(message: string): AgentId {
  if (/(send|transfer|pay|claim|wallet|balance)/i.test(message)) return 'wallet';
  if (/(quest|xp|reward|earn|level)/i.test(message)) return 'quests';
  if (/(tokenomics|token|gami|sale|raise|tge|airdrop|allocation|governance)/i.test(message)) {
    return 'tokenomics';
  }
  return 'wallet';
}

function buildSystemPrompt(tone: Tone, ctx: WalletContext, agent: AgentId): string {
  const lines: string[] = [];
  lines.push(
    'You are NOVA, the in-wallet AI copilot for GAMI — a self-custodial, wallet-first engagement network spanning multiple chains.',
  );
  lines.push(
    'You help the user discover relevant brand and ecosystem campaigns, understand tasks and rewards, compare cross-chain routes, check level/XP/balances, and prepare (never auto-send) swaps, bridges, and transfers.',
  );
  lines.push(TONE_GUIDE[tone]);
  lines.push(
    `You are currently coordinating the ${agent} specialist. Use only these tools: ${AGENT_TOOLS[agent].join(', ')}. Use a read tool whenever the answer depends on wallet, quest, sale, or token-plan facts. Never claim an action happened when you only prepared it.`,
  );
  lines.push(
    'Rules: Keep replies short (1-3 sentences unless asked to explain). NEVER invent balances, campaign availability, fees, routes, levels, or numbers — only use live context provided by Gami. You can prepare allowlisted actions, but the user must separately review the preview and sign through Privy. Never say that you signed, sent, claimed, or moved funds. Points are non-transferable engagement rewards that can unlock wallet benefits, never be sold. Never request or output private keys or seed phrases.',
  );

  const c: string[] = [];
  if (ctx.walletAddress) c.push(`public wallet address: ${ctx.walletAddress}`);
  if (ctx.chain) c.push(`chain: ${ctx.chain}`);
  if (ctx.handle) c.push(`handle: @${ctx.handle}`);
  if (typeof ctx.level === 'number') c.push(`level: ${ctx.level}`);
  if (typeof ctx.totalXP === 'number') c.push(`total XP: ${ctx.totalXP}`);
  if (typeof ctx.xpToNextLevel === 'number') c.push(`XP to next level: ${ctx.xpToNextLevel}`);
  if (typeof ctx.gamiBalance === 'number') c.push(`$GAMI balance: ${ctx.gamiBalance}`);
  if (typeof ctx.claimableGami === 'number') c.push(`claimable $GAMI: ${ctx.claimableGami}`);
  if (typeof ctx.points === 'number') c.push(`soulbound Points: ${ctx.points}`);
  if (typeof ctx.rank === 'number') c.push(`leaderboard rank: #${ctx.rank}`);
  if (ctx.interests && ctx.interests.length > 0) c.push(`interests: ${ctx.interests.join(', ')}`);
  if (c.length > 0) {
    lines.push(`Live wallet context for this user:\n- ${c.join('\n- ')}`);
  }
  return lines.join('\n\n');
}

function validAddress(value: unknown): value is string {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);
}

function isTextBlock(value: unknown): value is { type: 'text'; text: string } {
  if (!value || typeof value !== 'object') return false;
  return Reflect.get(value, 'type') === 'text' && typeof Reflect.get(value, 'text') === 'string';
}

function isToolUse(value: unknown): value is ToolUse {
  if (!value || typeof value !== 'object') return false;
  return (
    Reflect.get(value, 'type') === 'tool_use' &&
    typeof Reflect.get(value, 'id') === 'string' &&
    TOOL_IDS.includes(Reflect.get(value, 'name'))
  );
}

function validAmount(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value) &&
    Number(value) > 0 &&
    Number.isFinite(Number(value))
  );
}

function cleanContext(raw: unknown): WalletContext {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as Record<string, unknown>;
  const number = (key: string) =>
    typeof value[key] === 'number' && Number.isFinite(value[key])
      ? (value[key] as number)
      : undefined;
  return {
    walletAddress: validAddress(value.walletAddress) ? value.walletAddress : undefined,
    chain: value.chain === 'base' || value.chain === 'baseSepolia' ? value.chain : undefined,
    handle: typeof value.handle === 'string' ? value.handle.slice(0, 64) : undefined,
    level: number('level'),
    totalXP: number('totalXP'),
    xpToNextLevel: number('xpToNextLevel'),
    gamiBalance: number('gamiBalance'),
    claimableGami: number('claimableGami'),
    points: number('points'),
    rank: number('rank'),
    interests: Array.isArray(value.interests)
      ? value.interests.filter((item): item is string => typeof item === 'string').slice(0, 12)
      : undefined,
  };
}

async function executeTool(name: ToolId, input: Record<string, unknown>, ctx: WalletContext) {
  switch (name) {
    case 'wallet_overview':
      return {
        address: ctx.walletAddress ?? null,
        chain: ctx.chain ?? null,
        level: ctx.level ?? null,
        totalXP: ctx.totalXP ?? null,
        gamiBalance: ctx.gamiBalance ?? null,
        claimableGami: ctx.claimableGami ?? null,
        points: ctx.points ?? null,
      };
    case 'find_quests':
      return {
        quests: [
          { id: 'first-swap', title: 'First Swap', rewardXP: 500, duration: '5 MIN' },
          { id: 'join-presale', title: 'Join the Presale', rewardXP: 500, duration: '5 MIN' },
          { id: 'claim-tge', title: 'Claim at TGE', rewardXP: 1000, duration: '2 MIN' },
        ],
      };
    case 'sale_status': {
      const base = Deno.env.get('SUPABASE_URL');
      if (!base) return { available: false };
      const response = await fetch(`${base}/functions/v1/sale-stats`, {
        headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') ?? ''}` },
      });
      return response.ok ? await response.json() : { available: false };
    }
    case 'tokenomics':
      return {
        purpose: 'Utility and governance token for the Gami Protocol economy.',
        utilities: ['XP multiplier', 'tier access', 'reward pools', 'governance', 'partner access'],
        illustrativeAllocation: {
          communityAndRewards: '50%',
          teamAndAdvisors: '20%',
          strategicPartnersAndInvestors: '20%',
          treasuryAndReserves: '10%',
          status: 'Requires legal, treasury, and governance review.',
        },
        tgePrinciple: 'Launch should amplify a working ecosystem, not substitute for one.',
        airdropPrinciple: 'Reward useful, verified actions rather than speculation.',
        riskControls: [
          'geofencing',
          'claim caps',
          'sybil checks',
          'lockups',
          'vesting',
          'treasury controls',
          'anti-bot scoring',
          'legal review',
        ],
      };
    case 'prepare_gami_transfer':
      if (!ctx.walletAddress) throw new Error('No connected wallet');
      if (!validAddress(input.to) || !validAmount(input.amount)) {
        throw new Error('An exact 0x recipient and positive decimal amount are required');
      }
      return {
        proposal: {
          id: crypto.randomUUID(),
          kind: 'gami_transfer',
          chain: ctx.chain ?? 'baseSepolia',
          from: ctx.walletAddress,
          to: input.to,
          amount: input.amount,
          symbol: 'GAMI',
        },
      };
    case 'prepare_gami_claim':
      if (!ctx.walletAddress) throw new Error('No connected wallet');
      return {
        proposal: {
          id: crypto.randomUUID(),
          kind: 'gami_claim',
          chain: ctx.chain ?? 'baseSepolia',
          from: ctx.walletAddress,
          symbol: 'GAMI',
        },
      };
  }
}

async function askAnthropic(system: string, messages: unknown[]) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system,
      tools: TOOLS,
      messages,
    }),
  });
  if (!response.ok) throw new Error(`Anthropic request failed (${response.status})`);
  return await response.json();
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
    const tone: Tone =
      body.tone === 'shy' || body.tone === 'hype' || body.tone === 'chill' ? body.tone : 'chill';
    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter((message): message is ChatTurn =>
            Boolean(
              message &&
              (message.role === 'user' || message.role === 'assistant') &&
              typeof message.content === 'string',
            ),
          )
          .slice(-12)
          .map((message) => ({ ...message, content: message.content.slice(0, 2000) }))
      : [];
    const context = cleanContext(body.context);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const latest = messages.at(-1)?.content ?? '';
    const activeAgent = routeAgent(latest);
    const system = buildSystemPrompt(tone, context, activeAgent);
    const conversation: unknown[] = [...messages];
    const trace: Array<{ toolId: ToolId; agentId: AgentId; label: string; status: string }> = [];
    let proposal: unknown;
    let reply = '';

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const data = await askAnthropic(system, conversation);
      const content: unknown[] = Array.isArray(data?.content) ? data.content : [];
      const text = content
        .filter(isTextBlock)
        .map((block) => block.text)
        .join('\n')
        .trim();
      if (text) reply = text;

      const calls = content.filter(isToolUse);
      if (calls.length === 0) break;
      conversation.push({ role: 'assistant', content });
      const results = [];
      for (const call of calls) {
        const allowed = AGENT_TOOLS[activeAgent].includes(call.name);
        try {
          if (!allowed) throw new Error('Tool is not allowed for this specialist');
          const output = await executeTool(call.name, call.input ?? {}, context);
          if (output && typeof output === 'object' && 'proposal' in output) {
            proposal = output.proposal;
          }
          trace.push({
            toolId: call.name,
            agentId: activeAgent,
            label: TOOL_LABELS[call.name],
            status: 'completed',
          });
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: JSON.stringify(output),
          });
        } catch (error) {
          trace.push({
            toolId: call.name,
            agentId: activeAgent,
            label: TOOL_LABELS[call.name],
            status: 'failed',
          });
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            is_error: true,
            content: error instanceof Error ? error.message : 'Tool failed',
          });
        }
      }
      conversation.push({ role: 'user', content: results });
    }

    return new Response(
      JSON.stringify({
        reply: reply || 'I could not complete that request.',
        activeAgent,
        trace,
        proposal,
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
