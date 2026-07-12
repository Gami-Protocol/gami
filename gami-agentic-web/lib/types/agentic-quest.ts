export type QuestStateAction = 'CREATED' | 'PROGRESS_UPDATED' | 'COMPLETED' | 'NONE';
export type QuestStatus = 'active' | 'in_progress' | 'completed';

export interface QuestProfile {
  id: string;
  title: string;
  category: string;
  status: QuestStatus;
  progress: number;
  xpReward: number;
  earnedXp: number;
  sbtBadgeId?: string;
  createdAt: string;
}

export interface QuestDelta {
  action: QuestStateAction;
  quest?: QuestProfile;
  previousProgress?: number;
  xpGained?: number;
  totalXp?: number;
  level?: number;
  unlockedBadgeIds?: string[];
}

export interface AgenticChatRequest {
  sessionId: string;
  latestUserMessage: string;
  messages?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AgenticChatResponse {
  reply: string;
  stateAction: QuestStateAction;
  questDetails?: QuestDelta;
  ledgerEntryId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  stateAction?: QuestStateAction;
}

export interface LedgerEntry {
  id: string;
  action: QuestStateAction;
  questId?: string;
  xp: number;
  ts: string;
  message: string;
}

export interface SessionState {
  sessionId: string;
  totalXp: number;
  level: number;
  questProfiles: QuestProfile[];
  unlockedBadgeIds: string[];
  ledger: LedgerEntry[];
  lastMessage?: string;
  lastMessageAt?: number;
}

export interface SbtBadge {
  id: string;
  label: string;
  icon: string;
  unlockXp: number;
}

export interface QuestTemplate {
  category: string;
  title: string;
  xpReward: number;
  badgeId?: string;
}
