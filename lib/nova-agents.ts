export type NovaAgentId = 'wallet' | 'quests' | 'tokenomics';

export interface NovaAgent {
  id: NovaAgentId;
  name: string;
  description: string;
  toolIds: readonly NovaToolId[];
}

export type NovaToolId =
  | 'wallet_overview'
  | 'find_quests'
  | 'sale_status'
  | 'tokenomics'
  | 'prepare_gami_transfer'
  | 'prepare_gami_claim';

export const NOVA_AGENTS: readonly NovaAgent[] = [
  {
    id: 'wallet',
    name: 'Wallet Agent',
    description: 'Reads balances and prepares user-approved wallet actions.',
    toolIds: ['wallet_overview', 'prepare_gami_transfer', 'prepare_gami_claim'],
  },
  {
    id: 'quests',
    name: 'Quest Agent',
    description: 'Finds relevant GAMI quests and XP opportunities.',
    toolIds: ['find_quests'],
  },
  {
    id: 'tokenomics',
    name: 'GAMI Agent',
    description: 'Explains token utility, sale status, allocation, and TGE readiness.',
    toolIds: ['sale_status', 'tokenomics'],
  },
] as const;

export function getNovaAgent(id: NovaAgentId): NovaAgent {
  return NOVA_AGENTS.find((agent) => agent.id === id) ?? NOVA_AGENTS[0];
}

export function isNovaAgentId(value: unknown): value is NovaAgentId {
  return NOVA_AGENTS.some((agent) => agent.id === value);
}
