/**
 * MCP (Model Context Protocol) tool interface for Gami questing.
 *
 * Exposes quest operations as structured tools that AI agents (NOVA and
 * external gami-agent supervisors) can invoke. Each tool carries a
 * JSON-schema–compatible input spec so it can be registered with any
 * MCP-compatible host.
 *
 * Entry point for callers:
 *
 *   import { handleMcpTool, MCP_QUEST_TOOLS } from '@/lib/mcp-quests';
 *
 *   // Execute a tool call from an agent
 *   const result = await handleMcpTool('list_quests', {});
 *   const result = await handleMcpTool('complete_quest', { questId: 'first-swap' });
 *   const result = await handleMcpTool('get_my_level', {});
 *   const result = await handleMcpTool('check_agent_budget', {
 *     agentAddress: '0xABC…', amount: '1000000000000000000',
 *   });
 */

import type { Address } from 'viem';

import { checkAgentBudget as chainCheckAgentBudget, type AgentBudget } from '@/lib/chain-client';
import { QUESTS, type Quest } from '@/lib/config';
import {
  type ChainActionEnvelope,
  currentStats,
  type LevelStats,
  questComplete,
} from '@/lib/gami-sdk';

// ── Tool schema types ─────────────────────────────────────────────────────────

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

/**
 * Canonical list of MCP quest tools. Pass this array to any MCP host that
 * needs to discover available tools (e.g. the nova-chat Edge Function).
 */
export const MCP_QUEST_TOOLS: McpToolDefinition[] = [
  {
    name: 'list_quests',
    description: 'List all available quests with their XP rewards and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'Optional tag filter (e.g. "DEFI", "NFTs", "STREAK").',
        },
      },
      required: [],
    },
  },
  {
    name: 'complete_quest',
    description:
      'Submit a quest-completion write intent. Returns a queued envelope that advances to settled via the gami-agent supervisor.',
    inputSchema: {
      type: 'object',
      properties: {
        questId: { type: 'string', description: 'The quest ID to complete (e.g. "first-swap").' },
      },
      required: ['questId'],
    },
  },
  {
    name: 'get_my_level',
    description:
      'Return the current user level, total XP, XP-to-next-level, $GAMI balance, and leaderboard rank.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'check_agent_budget',
    description:
      'Check whether an AI agent address has remaining Treasury budget on the Gami Protocol chain.',
    inputSchema: {
      type: 'object',
      properties: {
        agentAddress: {
          type: 'string',
          description: 'EVM address of the AI agent (0x…).',
        },
        amount: {
          type: 'string',
          description: 'Budget amount to check, in wei, as a decimal string (e.g. "1000000000000000000").',
        },
      },
      required: ['agentAddress', 'amount'],
    },
  },
];

// ── Result type ───────────────────────────────────────────────────────────────

export interface McpResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Individual tool handlers ──────────────────────────────────────────────────

function handleListQuests(args: Record<string, unknown>): McpResult<Quest[]> {
  const tag = typeof args.tag === 'string' ? args.tag.toUpperCase() : null;
  const quests = tag ? QUESTS.filter((q) => q.tag === tag) : QUESTS;
  return { ok: true, data: quests };
}

function handleCompleteQuest(
  args: Record<string, unknown>,
): McpResult<{ envelopeId: string; status: string; questTitle: string; xp: number }> {
  const questId = typeof args.questId === 'string' ? args.questId : null;
  if (!questId) return { ok: false, error: 'questId is required.' };

  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest) return { ok: false, error: `Quest "${questId}" not found.` };

  // questComplete applies optimistic XP immediately and returns a queued envelope.
  let latestEnvelope: ChainActionEnvelope = {
    envelopeId: '',
    status: 'queued',
    action: { type: 'quest_complete', questId, xp: quest.reward },
  };
  const env = questComplete(quest.id, quest.reward, (update) => {
    latestEnvelope = update;
  });
  latestEnvelope = env;

  return {
    ok: true,
    data: {
      envelopeId: env.envelopeId,
      status: env.status,
      questTitle: quest.title,
      xp: quest.reward,
    },
  };
}

function handleGetMyLevel(): McpResult<LevelStats> {
  return { ok: true, data: currentStats() };
}

async function handleCheckAgentBudget(
  args: Record<string, unknown>,
): Promise<McpResult<AgentBudget>> {
  const agentAddress =
    typeof args.agentAddress === 'string' ? (args.agentAddress as Address) : null;
  const amountStr = typeof args.amount === 'string' ? args.amount : null;

  if (!agentAddress) return { ok: false, error: 'agentAddress is required.' };
  if (!amountStr) return { ok: false, error: 'amount is required.' };

  let amount: bigint;
  try {
    amount = BigInt(amountStr);
  } catch {
    return { ok: false, error: 'amount must be a valid integer string.' };
  }

  const rpcUrl = process.env.EXPO_PUBLIC_GAMI_RPC_URL;
  if (!rpcUrl) {
    // Mock when the chain node is not configured.
    return { ok: true, data: { allowed: true, remaining: BigInt(1_000_000_000) } };
  }

  const budget = await chainCheckAgentBudget(agentAddress, amount, rpcUrl);
  if (!budget) {
    return { ok: false, error: 'Could not reach the Gami chain to check agent budget.' };
  }
  return { ok: true, data: budget };
}

// ── Public dispatch function ──────────────────────────────────────────────────

/**
 * Dispatch an MCP tool call by name with the supplied arguments.
 *
 * This is the single entry point for agent-driven tool invocations — both from
 * NOVA's local scripted fallback and from the nova-chat Edge Function when it
 * returns a tool_call payload.
 */
export async function handleMcpTool(
  name: string,
  args: Record<string, unknown> = {},
): Promise<McpResult> {
  switch (name) {
    case 'list_quests':
      return handleListQuests(args);
    case 'complete_quest':
      return handleCompleteQuest(args);
    case 'get_my_level':
      return handleGetMyLevel();
    case 'check_agent_budget':
      return handleCheckAgentBudget(args);
    default:
      return { ok: false, error: `Unknown MCP tool: "${name}"` };
  }
}

// ── Human-readable formatter for NOVA's scripted replies ─────────────────────

/** Format a list_quests result into a short NOVA-style string. */
export function formatQuestList(quests: Quest[]): string {
  if (quests.length === 0) return 'No quests found for that tag.';
  return quests.map((q) => `• ${q.title} (+${q.reward} XP) — ${q.sub}`).join('\n');
}

/** Format a get_my_level result into a short NOVA-style string. */
export function formatLevelStats(s: LevelStats): string {
  return `Level ${s.level} · ${s.totalXP.toLocaleString()} XP · ${s.xpToNextLevel.toLocaleString()} to next · $GAMI ${s.gamiBalance.toFixed(2)} · Rank #${s.rank.toLocaleString()}`;
}
