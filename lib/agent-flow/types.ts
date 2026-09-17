export type RewardEventType =
  | 'quest_completed'
  | 'xp_threshold_reached'
  | 'referral_milestone'
  | 'campaign_participation'
  | 'partner_app_engagement'
  | 'agent_suggested_optimization';

export type RewardEventSource = 'wallet_app' | 'agentic_web' | 'partner_app' | 'system' | 'agent';

export interface RewardSignalEvent {
  eventId: string;
  tenantId: string;
  appId: string;
  userId?: string;
  walletAddress?: string;
  eventType: RewardEventType;
  timestamp: string;
  source: RewardEventSource;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}

export type RecommendationActionType =
  | 'grant_xp'
  | 'mark_quest_complete'
  | 'propose_token_reward'
  | 'flag_suspicious_activity'
  | 'throttle_reward_flow'
  | 'request_human_review'
  | 'update_campaign_strategy';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AgentRecommendation {
  recommendationId: string;
  agentId: string;
  tenantId: string;
  appId: string;
  userId?: string;
  walletAddress?: string;
  proposedAction: RecommendationActionType;
  confidence: number;
  rationale: string;
  proposedTokenAmount?: string;
  requiredPolicyChecks: PolicyCheckType[];
  riskLevel: RiskLevel;
  createdAt: string;
}

export type PolicyCheckType =
  | 'duplicate_event'
  | 'duplicate_recommendation'
  | 'tenant_quota'
  | 'app_quota'
  | 'per_user_reward_limit'
  | 'suspicious_velocity'
  | 'reward_budget'
  | 'token_settlement_eligibility'
  | 'token_amount_valid'
  | 'minimum_confidence'
  | 'allowed_action_type'
  | 'agent_self_approval';

export interface PolicyCheckResult {
  check: PolicyCheckType;
  passed: boolean;
  reason?: string;
}

export type PolicyDecision =
  | 'approved'
  | 'denied'
  | 'requires_manual_review'
  | 'deferred'
  | 'rate_limited';

export interface RewardPolicyResult {
  decision: PolicyDecision;
  auditableReason: string;
  checks: PolicyCheckResult[];
  reviewedAt: string;
}

export interface SettlementRequest {
  settlementId: string;
  idempotencyKey: string;
  tenantId: string;
  appId: string;
  recommendationId: string;
  userId?: string;
  walletAddress?: string;
  dryRun: boolean;
  tokenAmount?: string;
  tokenSymbol?: string;
}

export type SettlementStatus =
  | 'dry_run'
  | 'mock_settled'
  | 'pending_onchain'
  | 'completed'
  | 'failed'
  | 'deduped';

export interface SettlementReceipt {
  settlementId: string;
  idempotencyKey: string;
  status: SettlementStatus;
  transactionId?: string;
  failureReason?: string;
  createdAt: string;
}

export type AgentTelemetryEventType =
  | 'signal_received'
  | 'signal_deduped'
  | 'recommendation_created'
  | 'policy_evaluated'
  | 'policy_failure'
  | 'rate_limited'
  | 'settlement_attempted'
  | 'settlement_succeeded'
  | 'settlement_failed'
  | 'flow_completed';

export interface AgentTelemetryEvent {
  type: AgentTelemetryEventType;
  tenantId: string;
  appId: string;
  userId?: string;
  recommendationId?: string;
  eventId?: string;
  policyDecision?: PolicyDecision;
  confidence?: number;
  latencyMs?: number;
  queueDepth?: number;
  outcome?: 'success' | 'failure' | 'skipped';
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface RewardFlowContext {
  event: RewardSignalEvent;
  targetIdentity: string;
  dedupedEvent: boolean;
  receivedAt: string;
}

export interface RewardFlowExecutionResult {
  context: RewardFlowContext;
  recommendation: AgentRecommendation;
  policy: RewardPolicyResult;
  approved: boolean;
  settlement?: SettlementReceipt;
  telemetryEvents: AgentTelemetryEvent[];
}

export interface RewardPolicyConfig {
  minimumConfidence: number;
  tenantQuotaPerWindow: number;
  appQuotaPerWindow: number;
  userRewardLimit: number;
  suspiciousVelocityThreshold: number;
  rewardBudget: number;
  allowedActionTypes: RecommendationActionType[];
  manualReviewRiskLevels: RiskLevel[];
}

export interface RewardPolicyContext {
  duplicateEvent: boolean;
  duplicateRecommendation: boolean;
  tenantCountInWindow: number;
  appCountInWindow: number;
  userRewardsInWindow: number;
  userVelocityInWindow: number;
  rewardBudgetUsed: number;
  tokenSettlementEligible: boolean;
}

export interface RewardFlowStateStore {
  seenSignalIdempotencyKeys: Set<string>;
  seenRecommendationIds: Set<string>;
  settledIdempotencyKeys: Set<string>;
  tenantCounts: Map<string, number>;
  appCounts: Map<string, number>;
  userRewardCounts: Map<string, number>;
  userVelocity: Map<string, number>;
  budgetUsedByTenantApp: Map<string, number>;
}

export interface RewardSettlementAdapter {
  settle(request: SettlementRequest): Promise<SettlementReceipt>;
}

export interface AgentTelemetrySink {
  record(event: AgentTelemetryEvent): void | Promise<void>;
}

export interface AgentFlowScalabilityAdapter {
  getQueueDepth?(scope: { tenantId: string; appId: string }): number | Promise<number>;
  runWithControls?<T>(
    metadata: {
      tenantId: string;
      appId: string;
      idempotencyKey: string;
      flowName: 'agent_reward_flow';
    },
    task: () => Promise<T>,
  ): Promise<T>;
}
