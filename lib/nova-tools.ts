import { QUESTS } from '@/lib/config';
import type { LevelStats } from '@/lib/gami-sdk';
import type { NovaAgentId, NovaToolId } from '@/lib/nova-agents';
import { fetchSaleStats } from '@/lib/sale';

export type NovaProposal =
  | {
      id: string;
      kind: 'gami_transfer';
      chain: 'base' | 'baseSepolia';
      from: string;
      to: string;
      amount: string;
      symbol: 'GAMI';
    }
  | {
      id: string;
      kind: 'gami_claim';
      chain: 'base' | 'baseSepolia';
      from: string;
      symbol: 'GAMI';
    };

export interface NovaToolTrace {
  toolId: NovaToolId;
  agentId: NovaAgentId;
  label: string;
  status: 'completed' | 'failed';
}

export const NOVA_TOOL_LABELS: Record<NovaToolId, string> = {
  wallet_overview: 'Checked wallet balances',
  find_quests: 'Found matching quests',
  sale_status: 'Checked token raise',
  tokenomics: 'Reviewed GAMI tokenomics',
  prepare_gami_transfer: 'Prepared GAMI transfer',
  prepare_gami_claim: 'Prepared vested-token claim',
};

export interface LocalToolContext {
  stats: LevelStats;
  walletAddress?: string;
}

export async function executeNovaReadTool(
  toolId: NovaToolId,
  context: LocalToolContext,
): Promise<Record<string, unknown>> {
  switch (toolId) {
    case 'wallet_overview':
      return {
        address: context.walletAddress ?? null,
        gamiBalance: context.stats.gamiBalance,
        claimableGami: context.stats.claimableGami,
        points: context.stats.points,
        level: context.stats.level,
        balanceSource: context.stats.balanceSource,
      };
    case 'find_quests':
      return {
        quests: QUESTS.filter((quest) => quest.novaPick).slice(0, 4),
      };
    case 'sale_status':
      return { sale: await fetchSaleStats() };
    case 'tokenomics':
      return {
        purpose: '$GAMI is the utility and governance token for the Gami Protocol economy.',
        utilities: ['XP multipliers', 'tier access', 'reward pools', 'governance', 'partner access'],
      };
    default:
      throw new Error(`${toolId} is not a read-only client tool`);
  }
}

export function isNovaProposal(value: unknown): value is NovaProposal {
  if (!value || typeof value !== 'object') return false;
  const proposal = value as Record<string, unknown>;
  if (
    typeof proposal.id !== 'string' ||
    (proposal.chain !== 'base' && proposal.chain !== 'baseSepolia') ||
    typeof proposal.from !== 'string' ||
    proposal.symbol !== 'GAMI'
  ) {
    return false;
  }
  if (proposal.kind === 'gami_claim') return true;
  return (
    proposal.kind === 'gami_transfer' &&
    typeof proposal.to === 'string' &&
    typeof proposal.amount === 'string'
  );
}
