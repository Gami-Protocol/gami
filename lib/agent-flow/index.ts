import type {
  AgentFlowScalabilityAdapter,
  AgentRecommendation,
  AgentTelemetryEvent,
  AgentTelemetrySink,
  RewardFlowContext,
  RewardFlowExecutionResult,
  RewardFlowStateStore,
  RewardPolicyConfig,
  RewardPolicyContext,
  RewardPolicyResult,
  RewardSettlementAdapter,
  RewardSignalEvent,
  SettlementReceipt,
  SettlementRequest,
} from '@/lib/agent-flow/types';

export type {
  AgentFlowScalabilityAdapter,
  AgentRecommendation,
  AgentTelemetryEvent,
  AgentTelemetrySink,
  PolicyCheckResult,
  PolicyCheckType,
  PolicyDecision,
  RecommendationActionType,
  RewardEventSource,
  RewardEventType,
  RewardFlowContext,
  RewardFlowExecutionResult,
  RewardFlowStateStore,
  RewardPolicyConfig,
  RewardPolicyContext,
  RewardPolicyResult,
  RewardSettlementAdapter,
  RewardSignalEvent,
  RiskLevel,
  SettlementReceipt,
  SettlementRequest,
  SettlementStatus,
} from '@/lib/agent-flow/types';

const DEFAULT_POLICY: RewardPolicyConfig = {
  minimumConfidence: 0.7,
  tenantQuotaPerWindow: 100,
  appQuotaPerWindow: 100,
  userRewardLimit: 25,
  suspiciousVelocityThreshold: 10,
  rewardBudget: 10_000,
  allowedActionTypes: [
    'grant_xp',
    'mark_quest_complete',
    'propose_token_reward',
    'flag_suspicious_activity',
    'throttle_reward_flow',
    'request_human_review',
    'update_campaign_strategy',
  ],
  manualReviewRiskLevels: ['high', 'critical'],
};

export function createInMemoryRewardFlowStateStore(): RewardFlowStateStore {
  return {
    seenSignalIdempotencyKeys: new Set<string>(),
    seenRecommendationIds: new Set<string>(),
    settledIdempotencyKeys: new Set<string>(),
    tenantCounts: new Map<string, number>(),
    appCounts: new Map<string, number>(),
    userRewardCounts: new Map<string, number>(),
    userVelocity: new Map<string, number>(),
    budgetUsedByTenantApp: new Map<string, number>(),
  };
}

export class InMemoryTelemetrySink implements AgentTelemetrySink {
  readonly events: AgentTelemetryEvent[] = [];

  record(event: AgentTelemetryEvent): void {
    this.events.push(event);
  }
}

export function createMockSettlementAdapter(options?: {
  mode?: 'dry-run' | 'mock-success' | 'mock-failure' | 'pending-onchain';
}): RewardSettlementAdapter {
  const receipts = new Map<string, SettlementReceipt>();
  const mode = options?.mode ?? 'dry-run';

  return {
    async settle(request: SettlementRequest): Promise<SettlementReceipt> {
      const existing = receipts.get(request.idempotencyKey);
      if (existing) {
        return { ...existing, status: 'deduped' };
      }

      let receipt: SettlementReceipt;
      if (mode === 'pending-onchain') {
        receipt = {
          settlementId: request.settlementId,
          idempotencyKey: request.idempotencyKey,
          status: 'pending_onchain',
          transactionId: `tx_${request.settlementId}`,
          createdAt: new Date().toISOString(),
        };
      } else if (mode === 'mock-failure') {
        receipt = {
          settlementId: request.settlementId,
          idempotencyKey: request.idempotencyKey,
          status: 'failed',
          failureReason: 'Mock settlement failure',
          createdAt: new Date().toISOString(),
        };
      } else if (mode === 'mock-success') {
        receipt = {
          settlementId: request.settlementId,
          idempotencyKey: request.idempotencyKey,
          status: 'completed',
          transactionId: `tx_${request.settlementId}`,
          createdAt: new Date().toISOString(),
        };
      } else {
        receipt = {
          settlementId: request.settlementId,
          idempotencyKey: request.idempotencyKey,
          status: 'dry_run',
          createdAt: new Date().toISOString(),
        };
      }

      receipts.set(request.idempotencyKey, receipt);
      return receipt;
    },
  };
}

export function submitRewardSignal(
  event: RewardSignalEvent,
  stateStore: RewardFlowStateStore,
): RewardFlowContext {
  const targetIdentity = event.walletAddress ?? event.userId ?? `event:${event.eventId}`;
  const dedupedEvent = stateStore.seenSignalIdempotencyKeys.has(event.idempotencyKey);

  if (!dedupedEvent) {
    stateStore.seenSignalIdempotencyKeys.add(event.idempotencyKey);
    incrementMap(stateStore.tenantCounts, event.tenantId);
    incrementMap(stateStore.appCounts, `${event.tenantId}:${event.appId}`);
    incrementMap(stateStore.userVelocity, `${event.tenantId}:${event.appId}:${targetIdentity}`);
  }

  return {
    event,
    targetIdentity,
    dedupedEvent,
    receivedAt: new Date().toISOString(),
  };
}

export function createAgentRecommendation(input: {
  context: RewardFlowContext;
  recommendation: Omit<
    AgentRecommendation,
    'tenantId' | 'appId' | 'userId' | 'walletAddress' | 'createdAt'
  >;
}): AgentRecommendation {
  const { context, recommendation } = input;
  return {
    ...recommendation,
    tenantId: context.event.tenantId,
    appId: context.event.appId,
    userId: context.event.userId,
    walletAddress: context.event.walletAddress,
    createdAt: new Date().toISOString(),
  };
}

export function evaluateRewardPolicy(input: {
  context: RewardFlowContext;
  recommendation: AgentRecommendation;
  stateStore: RewardFlowStateStore;
  policyConfig?: Partial<RewardPolicyConfig>;
  tokenSettlementEligible?: boolean;
  approverId?: string;
}): RewardPolicyResult {
  const policy = { ...DEFAULT_POLICY, ...input.policyConfig };
  const tenantAppKey = `${input.context.event.tenantId}:${input.context.event.appId}`;
  const userKey = `${tenantAppKey}:${input.context.targetIdentity}`;
  const rewardUnits = extractRewardUnits(input.recommendation);

  const policyContext: RewardPolicyContext = {
    duplicateEvent: input.context.dedupedEvent,
    duplicateRecommendation: input.stateStore.seenRecommendationIds.has(
      input.recommendation.recommendationId,
    ),
    tenantCountInWindow: input.stateStore.tenantCounts.get(input.context.event.tenantId) ?? 0,
    appCountInWindow: input.stateStore.appCounts.get(tenantAppKey) ?? 0,
    userRewardsInWindow: input.stateStore.userRewardCounts.get(userKey) ?? 0,
    userVelocityInWindow: input.stateStore.userVelocity.get(userKey) ?? 0,
    rewardBudgetUsed: input.stateStore.budgetUsedByTenantApp.get(tenantAppKey) ?? 0,
    tokenSettlementEligible: input.tokenSettlementEligible ?? true,
  };

  const checks = [
    check('duplicate_event', !policyContext.duplicateEvent, 'Duplicate event idempotency key'),
    check(
      'duplicate_recommendation',
      !policyContext.duplicateRecommendation,
      'Duplicate recommendation id',
    ),
    check(
      'allowed_action_type',
      policy.allowedActionTypes.includes(input.recommendation.proposedAction),
      'Action type not allowed',
    ),
    check(
      'minimum_confidence',
      input.recommendation.confidence >= policy.minimumConfidence,
      'Recommendation confidence below policy threshold',
    ),
    check(
      'tenant_quota',
      policyContext.tenantCountInWindow <= policy.tenantQuotaPerWindow,
      'Tenant quota exceeded',
    ),
    check(
      'app_quota',
      policyContext.appCountInWindow <= policy.appQuotaPerWindow,
      'App quota exceeded',
    ),
    check(
      'per_user_reward_limit',
      policyContext.userRewardsInWindow + rewardUnits <= policy.userRewardLimit,
      'Per-user reward limit exceeded',
    ),
    check(
      'suspicious_velocity',
      policyContext.userVelocityInWindow <= policy.suspiciousVelocityThreshold,
      'Suspicious event velocity',
    ),
    check(
      'reward_budget',
      policyContext.rewardBudgetUsed + rewardUnits <= policy.rewardBudget,
      'Reward budget exceeded',
    ),
    check(
      'token_settlement_eligibility',
      input.recommendation.proposedAction !== 'propose_token_reward' ||
        policyContext.tokenSettlementEligible,
      'Token settlement not eligible',
    ),
    check(
      'agent_self_approval',
      !input.approverId || input.approverId !== input.recommendation.agentId,
      'Agents must never approve their own recommendations',
    ),
  ];

  let decision: RewardPolicyResult['decision'] = 'approved';
  let auditableReason = 'Policy checks passed';

  const failed = checks.find((entry) => !entry.passed);
  if (failed) {
    decision =
      failed.check === 'tenant_quota' || failed.check === 'app_quota' ? 'rate_limited' : 'denied';
    auditableReason = failed.reason ?? 'Policy denied recommendation';
  }

  if (
    decision === 'approved' &&
    policy.manualReviewRiskLevels.includes(input.recommendation.riskLevel)
  ) {
    decision = 'requires_manual_review';
    auditableReason = `Risk level ${input.recommendation.riskLevel} requires review`;
  }

  if (
    decision === 'approved' &&
    (input.recommendation.proposedAction === 'throttle_reward_flow' ||
      input.recommendation.proposedAction === 'update_campaign_strategy')
  ) {
    decision = 'deferred';
    auditableReason = `Action ${input.recommendation.proposedAction} deferred for downstream execution`;
  }

  if (decision === 'approved') {
    input.stateStore.seenRecommendationIds.add(input.recommendation.recommendationId);
  }

  return {
    decision,
    auditableReason,
    checks,
    reviewedAt: new Date().toISOString(),
  };
}

export function approveRewardAction(input: {
  recommendation: AgentRecommendation;
  policyResult: RewardPolicyResult;
  approverId: string;
}): { approved: boolean; reason: string } {
  if (input.approverId === input.recommendation.agentId) {
    return {
      approved: false,
      reason: 'Agents must never approve their own recommendations',
    };
  }
  if (input.policyResult.decision !== 'approved') {
    return {
      approved: false,
      reason: `Policy decision is ${input.policyResult.decision}`,
    };
  }
  return { approved: true, reason: 'Approved by deterministic policy gate' };
}

export async function settleRewardAction(input: {
  context: RewardFlowContext;
  recommendation: AgentRecommendation;
  approved: boolean;
  stateStore: RewardFlowStateStore;
  settlementAdapter: RewardSettlementAdapter;
  dryRun?: boolean;
}): Promise<SettlementReceipt | undefined> {
  if (!input.approved || input.recommendation.proposedAction !== 'propose_token_reward') {
    return undefined;
  }

  const settlementKey = `${input.context.event.idempotencyKey}:${input.recommendation.recommendationId}`;
  if (input.stateStore.settledIdempotencyKeys.has(settlementKey)) {
    return {
      settlementId: `stl_${input.recommendation.recommendationId}`,
      idempotencyKey: settlementKey,
      status: 'deduped',
      createdAt: new Date().toISOString(),
    };
  }

  const tokenAmount = stringifyTokenAmount(input.recommendation);
  const receipt = await input.settlementAdapter.settle({
    settlementId: `stl_${input.recommendation.recommendationId}`,
    idempotencyKey: settlementKey,
    tenantId: input.context.event.tenantId,
    appId: input.context.event.appId,
    recommendationId: input.recommendation.recommendationId,
    userId: input.context.event.userId,
    walletAddress: input.context.event.walletAddress,
    dryRun: Boolean(input.dryRun),
    tokenAmount,
    tokenSymbol: tokenAmount ? 'GAMI' : undefined,
  });

  if (
    receipt.status === 'completed' ||
    receipt.status === 'pending_onchain' ||
    receipt.status === 'dry_run'
  ) {
    input.stateStore.settledIdempotencyKeys.add(settlementKey);
    const tenantAppKey = `${input.context.event.tenantId}:${input.context.event.appId}`;
    const userKey = `${tenantAppKey}:${input.context.targetIdentity}`;
    const rewardUnits = extractRewardUnits(input.recommendation);
    incrementMap(input.stateStore.userRewardCounts, userKey, rewardUnits);
    incrementMap(input.stateStore.budgetUsedByTenantApp, tenantAppKey, rewardUnits);
  }

  return receipt;
}

export async function recordAgentTelemetry(
  event: AgentTelemetryEvent,
  sink: AgentTelemetrySink,
): Promise<void> {
  await sink.record(event);
}

export async function runAgentRewardFlow(input: {
  event: RewardSignalEvent;
  recommendationInput: Omit<
    AgentRecommendation,
    'tenantId' | 'appId' | 'userId' | 'walletAddress' | 'createdAt'
  >;
  stateStore: RewardFlowStateStore;
  settlementAdapter: RewardSettlementAdapter;
  telemetrySink: AgentTelemetrySink;
  approverId: string;
  policyConfig?: Partial<RewardPolicyConfig>;
  tokenSettlementEligible?: boolean;
  dryRun?: boolean;
  scalabilityAdapter?: AgentFlowScalabilityAdapter;
}): Promise<RewardFlowExecutionResult> {
  const startedAt = Date.now();
  const context = submitRewardSignal(input.event, input.stateStore);
  const recommendation = createAgentRecommendation({
    context,
    recommendation: input.recommendationInput,
  });

  const telemetryEvents: AgentTelemetryEvent[] = [];
  const queueDepth =
    (await input.scalabilityAdapter?.getQueueDepth?.({
      tenantId: context.event.tenantId,
      appId: context.event.appId,
    })) ?? undefined;

  await pushTelemetry(
    telemetryEvents,
    {
      type: context.dedupedEvent ? 'signal_deduped' : 'signal_received',
      tenantId: context.event.tenantId,
      appId: context.event.appId,
      userId: context.event.userId,
      eventId: context.event.eventId,
      timestamp: new Date().toISOString(),
      queueDepth,
    },
    input.telemetrySink,
  );

  await pushTelemetry(
    telemetryEvents,
    {
      type: 'recommendation_created',
      tenantId: recommendation.tenantId,
      appId: recommendation.appId,
      userId: recommendation.userId,
      eventId: context.event.eventId,
      recommendationId: recommendation.recommendationId,
      confidence: recommendation.confidence,
      timestamp: new Date().toISOString(),
      queueDepth,
    },
    input.telemetrySink,
  );

  const runPolicy = async () =>
    evaluateRewardPolicy({
      context,
      recommendation,
      stateStore: input.stateStore,
      policyConfig: input.policyConfig,
      tokenSettlementEligible: input.tokenSettlementEligible,
      approverId: input.approverId,
    });

  const policy = input.scalabilityAdapter?.runWithControls
    ? await input.scalabilityAdapter.runWithControls(
        {
          tenantId: context.event.tenantId,
          appId: context.event.appId,
          idempotencyKey: context.event.idempotencyKey,
          flowName: 'agent_reward_flow',
        },
        runPolicy,
      )
    : await runPolicy();

  await pushTelemetry(
    telemetryEvents,
    {
      type: policy.decision === 'denied' ? 'policy_failure' : 'policy_evaluated',
      tenantId: context.event.tenantId,
      appId: context.event.appId,
      userId: context.event.userId,
      recommendationId: recommendation.recommendationId,
      policyDecision: policy.decision,
      confidence: recommendation.confidence,
      timestamp: new Date().toISOString(),
      queueDepth,
    },
    input.telemetrySink,
  );

  if (policy.decision === 'rate_limited') {
    await pushTelemetry(
      telemetryEvents,
      {
        type: 'rate_limited',
        tenantId: context.event.tenantId,
        appId: context.event.appId,
        userId: context.event.userId,
        recommendationId: recommendation.recommendationId,
        policyDecision: policy.decision,
        timestamp: new Date().toISOString(),
        queueDepth,
      },
      input.telemetrySink,
    );
  }

  const approval = approveRewardAction({
    recommendation,
    policyResult: policy,
    approverId: input.approverId,
  });

  let settlement: SettlementReceipt | undefined;
  if (approval.approved && recommendation.proposedAction === 'propose_token_reward') {
    await pushTelemetry(
      telemetryEvents,
      {
        type: 'settlement_attempted',
        tenantId: context.event.tenantId,
        appId: context.event.appId,
        userId: context.event.userId,
        recommendationId: recommendation.recommendationId,
        timestamp: new Date().toISOString(),
        queueDepth,
      },
      input.telemetrySink,
    );

    settlement = await settleRewardAction({
      context,
      recommendation,
      approved: approval.approved,
      stateStore: input.stateStore,
      settlementAdapter: input.settlementAdapter,
      dryRun: input.dryRun,
    });

    if (settlement?.status === 'failed') {
      await pushTelemetry(
        telemetryEvents,
        {
          type: 'settlement_failed',
          tenantId: context.event.tenantId,
          appId: context.event.appId,
          userId: context.event.userId,
          recommendationId: recommendation.recommendationId,
          timestamp: new Date().toISOString(),
          queueDepth,
          outcome: 'failure',
        },
        input.telemetrySink,
      );
    } else if (settlement) {
      await pushTelemetry(
        telemetryEvents,
        {
          type: 'settlement_succeeded',
          tenantId: context.event.tenantId,
          appId: context.event.appId,
          userId: context.event.userId,
          recommendationId: recommendation.recommendationId,
          timestamp: new Date().toISOString(),
          queueDepth,
          outcome: settlement.status === 'deduped' ? 'skipped' : 'success',
        },
        input.telemetrySink,
      );
    }
  }

  await pushTelemetry(
    telemetryEvents,
    {
      type: 'flow_completed',
      tenantId: context.event.tenantId,
      appId: context.event.appId,
      userId: context.event.userId,
      recommendationId: recommendation.recommendationId,
      policyDecision: policy.decision,
      confidence: recommendation.confidence,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      queueDepth,
      outcome: approval.approved ? 'success' : 'skipped',
      details: {
        approvalReason: approval.reason,
        settlementStatus: settlement?.status,
      },
    },
    input.telemetrySink,
  );

  return {
    context,
    recommendation,
    policy,
    approved: approval.approved,
    settlement,
    telemetryEvents,
  };
}

async function pushTelemetry(
  bag: AgentTelemetryEvent[],
  event: AgentTelemetryEvent,
  sink: AgentTelemetrySink,
): Promise<void> {
  bag.push(event);
  await recordAgentTelemetry(event, sink);
}

function incrementMap(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function check(checkName: RewardPolicyContextCheck, passed: boolean, reason: string) {
  return {
    check: checkName,
    passed,
    reason: passed ? undefined : reason,
  };
}

type RewardPolicyContextCheck = RewardPolicyResult['checks'][number]['check'];

function extractRewardUnits(recommendation: AgentRecommendation): number {
  if (recommendation.proposedAction !== 'propose_token_reward') return 0;
  const raw = recommendation.requiredPolicyChecks.find(
    (checkName) => checkName === 'reward_budget',
  );
  if (!raw) return 1;
  return 1;
}

function stringifyTokenAmount(recommendation: AgentRecommendation): string | undefined {
  if (recommendation.proposedAction !== 'propose_token_reward') return undefined;
  const amount = recommendation.rationale.match(/(\d+(?:\.\d+)?)/)?.[1];
  return amount ?? '1';
}
