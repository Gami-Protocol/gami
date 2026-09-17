export type RewardEventType =
  | 'quest_completed'
  | 'xp_threshold_reached'
  | 'referral_milestone'
  | 'campaign_participation'
  | 'partner_app_engagement'
  | 'agent_suggested_optimization';

export type RewardEventSource =
  | 'quest-engine'
  | 'wallet-app'
  | 'partner-app'
  | 'campaign-engine'
  | 'agent-system'
  | 'manual-import';

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

export type RewardActionType =
  | 'grant_xp'
  | 'mark_quest_complete'
  | 'propose_token_reward'
  | 'flag_suspicious_activity'
  | 'throttle_reward_flow'
  | 'request_human_review'
  | 'update_campaign_strategy';

export type RewardRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RewardPolicyCheckName =
  | 'duplicate_event'
  | 'duplicate_recommendation'
  | 'tenant_quota'
  | 'app_quota'
  | 'per_user_reward_limit'
  | 'suspicious_velocity'
  | 'reward_budget'
  | 'token_settlement_eligibility'
  | 'minimum_confidence'
  | 'allowed_action_type';

export interface RewardActionProposal {
  type: RewardActionType;
  xp?: number;
  questId?: string;
  tokenAmount?: string;
  tokenSymbol?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRecommendation {
  recommendationId: string;
  producingAgentId: string;
  tenantId: string;
  appId: string;
  targetUserId?: string;
  targetWallet?: string;
  proposedAction: RewardActionProposal;
  confidence: number;
  rationale: string;
  requiredPolicyChecks: RewardPolicyCheckName[];
  riskLevel: RewardRiskLevel;
  createdAt: string;
}

export interface RewardPolicyCheckResult {
  name: RewardPolicyCheckName;
  status: 'passed' | 'failed' | 'skipped';
  detail: string;
}

export type RewardPolicyDecision =
  | 'approved'
  | 'denied'
  | 'manual_review'
  | 'deferred'
  | 'rate_limited';

export interface RewardPolicyResult {
  auditId: string;
  decision: RewardPolicyDecision;
  checks: RewardPolicyCheckResult[];
  reasonCodes: string[];
  settlementEligible: boolean;
  evaluatedAt: string;
}

export interface RewardActionApproval {
  approvalId: string;
  recommendationId: string;
  policyAuditId: string;
  approvedAt: string;
  approvedBy: 'policy-engine';
  settlementRequired: boolean;
}

export type RewardSettlementMode = 'dry_run' | 'mock' | 'onchain_prepare';

export interface RewardSettlementRequest {
  requestId: string;
  approvalId: string;
  recommendationId: string;
  tenantId: string;
  appId: string;
  userId?: string;
  walletAddress?: string;
  proposedAction: RewardActionProposal;
  idempotencyKey: string;
  mode: RewardSettlementMode;
}

export type RewardSettlementStatus =
  | 'dry_run'
  | 'mock_settled'
  | 'pending_onchain'
  | 'completed'
  | 'failed';

export interface RewardSettlementReceipt {
  settlementId: string;
  requestId: string;
  idempotencyKey: string;
  status: RewardSettlementStatus;
  settledAt: string;
  failureReason?: string;
}

export type RewardTelemetryType =
  | 'signal.accepted'
  | 'signal.deduped'
  | 'recommendation.approved'
  | 'recommendation.denied'
  | 'recommendation.manual_review'
  | 'policy.rate_limited'
  | 'settlement.attempted'
  | 'settlement.succeeded'
  | 'settlement.failed'
  | 'agent.confidence_outcome';

export interface RewardTelemetryEvent {
  telemetryId: string;
  flowId: string;
  tenantId: string;
  appId: string;
  userId?: string;
  recommendationId?: string;
  type: RewardTelemetryType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface RewardFlowContext {
  flowId: string;
  signal: RewardSignalEvent;
  receivedAt: string;
}

export interface RewardFlowExecutionResult {
  context: RewardFlowContext;
  recommendation: AgentRecommendation;
  policyResult: RewardPolicyResult;
  approval: RewardActionApproval | null;
  settlement: RewardSettlementReceipt | null;
  telemetry: RewardTelemetryEvent[];
  deduped: boolean;
}

export interface RewardPolicyConfig {
  minimumConfidence: number;
  allowedActionTypes: RewardActionType[];
  tenantQuota: number;
  appQuota: number;
  userRewardLimit: number;
  suspiciousVelocityWindowMs: number;
  suspiciousVelocityMaxEvents: number;
  tenantRateLimitWindowMs: number;
  tenantRateLimitMaxEvents: number;
  appRateLimitWindowMs: number;
  appRateLimitMaxEvents: number;
  rewardBudgetTokens: number;
}

export interface RewardSettlementAdapter {
  settle(request: RewardSettlementRequest): Promise<RewardSettlementReceipt>;
}

export interface RewardTelemetrySink {
  record(event: RewardTelemetryEvent): void | Promise<void>;
}

export interface RewardScalabilityJob {
  tenantId: string;
  appId: string;
  idempotencyKey: string;
}

export interface RewardScalabilityAdapter {
  run?<T>(job: RewardScalabilityJob, worker: () => Promise<T>): Promise<T>;
  getQueueDepth?(job: RewardScalabilityJob): number;
  getRetryDelayMs?(attempt: number): number;
  onDeadLetter?(job: RewardScalabilityJob, error: Error): void | Promise<void>;
}

interface RewardFlowStore {
  seenSignals: Map<string, RewardFlowExecutionResult>;
  seenRecommendations: Set<string>;
  settlementReceipts: Map<string, RewardSettlementReceipt>;
  settlementLedger: RewardSettlementRequest[];
  tenantSignalTimestamps: Map<string, number[]>;
  appSignalTimestamps: Map<string, number[]>;
  userSignalTimestamps: Map<string, number[]>;
}

export interface AgentRewardFlowDependencies {
  policyConfig?: Partial<RewardPolicyConfig>;
  settlementAdapter?: RewardSettlementAdapter;
  telemetrySink?: RewardTelemetrySink;
  scalability?: RewardScalabilityAdapter;
}

export interface CreateAgentRecommendationInput {
  recommendationId?: string;
  producingAgentId: string;
  tenantId: string;
  appId: string;
  targetUserId?: string;
  targetWallet?: string;
  proposedAction: RewardActionProposal;
  confidence: number;
  rationale: string;
  requiredPolicyChecks?: RewardPolicyCheckName[];
  riskLevel?: RewardRiskLevel;
  createdAt?: string;
}

export interface RunAgentRewardFlowInput {
  signal: RewardSignalEvent;
  recommendation: AgentRecommendation;
  settlementMode?: RewardSettlementMode;
}

export interface InMemoryTelemetrySink extends RewardTelemetrySink {
  readonly events: RewardTelemetryEvent[];
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeTimestamp(value?: string): string {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

function signalTimestampMs(signal: RewardSignalEvent): number {
  return new Date(signal.timestamp).getTime() || Date.now();
}

function pruneWindow(entries: number[] | undefined, now: number, windowMs: number): number[] {
  return (entries ?? []).filter((entry) => now - entry < windowMs);
}

function parseTokenAmount(value?: string): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSettlementRequired(action: RewardActionProposal): boolean {
  return action.type === 'propose_token_reward';
}

function createStore(): RewardFlowStore {
  return {
    seenSignals: new Map<string, RewardFlowExecutionResult>(),
    seenRecommendations: new Set<string>(),
    settlementReceipts: new Map<string, RewardSettlementReceipt>(),
    settlementLedger: [],
    tenantSignalTimestamps: new Map<string, number[]>(),
    appSignalTimestamps: new Map<string, number[]>(),
    userSignalTimestamps: new Map<string, number[]>(),
  };
}

function policyDefaults(): RewardPolicyConfig {
  return {
    minimumConfidence: 0.75,
    allowedActionTypes: [
      'grant_xp',
      'mark_quest_complete',
      'propose_token_reward',
      'flag_suspicious_activity',
      'throttle_reward_flow',
      'request_human_review',
      'update_campaign_strategy',
    ],
    tenantQuota: 500,
    appQuota: 250,
    userRewardLimit: 5,
    suspiciousVelocityWindowMs: 60_000,
    suspiciousVelocityMaxEvents: 5,
    tenantRateLimitWindowMs: 60_000,
    tenantRateLimitMaxEvents: 20,
    appRateLimitWindowMs: 60_000,
    appRateLimitMaxEvents: 10,
    rewardBudgetTokens: 10_000,
  };
}

export function createMockSettlementAdapter(input?: {
  failIdempotencyKeys?: string[];
  failActionTypes?: RewardActionType[];
}): RewardSettlementAdapter {
  const receipts = new Map<string, RewardSettlementReceipt>();
  const failIdempotencyKeys = new Set(input?.failIdempotencyKeys ?? []);
  const failActionTypes = new Set(input?.failActionTypes ?? []);

  return {
    async settle(request) {
      const existing = receipts.get(request.idempotencyKey);
      if (existing) return existing;

      let status: RewardSettlementStatus;
      let failureReason: string | undefined;
      if (request.mode === 'dry_run') {
        status = 'dry_run';
      } else if (
        failIdempotencyKeys.has(request.idempotencyKey) ||
        failActionTypes.has(request.proposedAction.type)
      ) {
        status = 'failed';
        failureReason = 'Mock settlement failure';
      } else if (request.mode === 'onchain_prepare') {
        status = 'pending_onchain';
      } else {
        status =
          request.proposedAction.type === 'propose_token_reward' ? 'mock_settled' : 'completed';
      }

      const receipt: RewardSettlementReceipt = {
        settlementId: createId('settlement'),
        requestId: request.requestId,
        idempotencyKey: request.idempotencyKey,
        status,
        settledAt: nowIso(),
        failureReason,
      };
      receipts.set(request.idempotencyKey, receipt);
      return receipt;
    },
  };
}

export function createInMemoryTelemetrySink(): InMemoryTelemetrySink {
  const events: RewardTelemetryEvent[] = [];
  return {
    events,
    record(event) {
      events.push(event);
    },
  };
}

export function createAgentRewardFlow(dependencies: AgentRewardFlowDependencies = {}) {
  const store = createStore();
  const policy = { ...policyDefaults(), ...dependencies.policyConfig };
  const settlementAdapter = dependencies.settlementAdapter ?? createMockSettlementAdapter();
  const telemetrySink = dependencies.telemetrySink ?? createInMemoryTelemetrySink();
  const scalability = dependencies.scalability;

  function settlementCountForTenant(tenantId: string): number {
    return store.settlementLedger.filter((entry) => entry.tenantId === tenantId).length;
  }

  function settlementCountForApp(tenantId: string, appId: string): number {
    return store.settlementLedger.filter(
      (entry) => entry.tenantId === tenantId && entry.appId === appId,
    ).length;
  }

  function settlementCountForUser(userId?: string, walletAddress?: string): number {
    if (!userId && !walletAddress) return 0;
    return store.settlementLedger.filter(
      (entry) =>
        (userId && entry.userId === userId) ||
        (walletAddress && entry.walletAddress?.toLowerCase() === walletAddress.toLowerCase()),
    ).length;
  }

  function settledTokenTotal(): number {
    return store.settlementLedger.reduce(
      (total, entry) => total + parseTokenAmount(entry.proposedAction.tokenAmount),
      0,
    );
  }

  function recordScopeTimestamp(
    signal: RewardSignalEvent,
    timestamp: number,
  ): {
    tenantCount: number;
    appCount: number;
    userCount: number;
  } {
    const tenantEntries = pruneWindow(
      store.tenantSignalTimestamps.get(signal.tenantId),
      timestamp,
      policy.tenantRateLimitWindowMs,
    );
    tenantEntries.push(timestamp);
    store.tenantSignalTimestamps.set(signal.tenantId, tenantEntries);

    const appKey = `${signal.tenantId}:${signal.appId}`;
    const appEntries = pruneWindow(
      store.appSignalTimestamps.get(appKey),
      timestamp,
      policy.appRateLimitWindowMs,
    );
    appEntries.push(timestamp);
    store.appSignalTimestamps.set(appKey, appEntries);

    const userKey = `${signal.tenantId}:${signal.appId}:${signal.userId ?? signal.walletAddress ?? 'anonymous'}`;
    const userEntries = pruneWindow(
      store.userSignalTimestamps.get(userKey),
      timestamp,
      policy.suspiciousVelocityWindowMs,
    );
    userEntries.push(timestamp);
    store.userSignalTimestamps.set(userKey, userEntries);

    return {
      tenantCount: tenantEntries.length,
      appCount: appEntries.length,
      userCount: userEntries.length,
    };
  }

  function previewScopeCounts(
    signal: RewardSignalEvent,
    timestamp: number,
  ): {
    tenantCount: number;
    appCount: number;
    userCount: number;
  } {
    const tenantCount =
      pruneWindow(
        store.tenantSignalTimestamps.get(signal.tenantId),
        timestamp,
        policy.tenantRateLimitWindowMs,
      ).length + 1;
    const appCount =
      pruneWindow(
        store.appSignalTimestamps.get(`${signal.tenantId}:${signal.appId}`),
        timestamp,
        policy.appRateLimitWindowMs,
      ).length + 1;
    const userCount =
      pruneWindow(
        store.userSignalTimestamps.get(
          `${signal.tenantId}:${signal.appId}:${signal.userId ?? signal.walletAddress ?? 'anonymous'}`,
        ),
        timestamp,
        policy.suspiciousVelocityWindowMs,
      ).length + 1;
    return {
      tenantCount,
      appCount,
      userCount,
    };
  }

  function getQueueDepth(signal: RewardSignalEvent): number | undefined {
    return scalability?.getQueueDepth?.({
      tenantId: signal.tenantId,
      appId: signal.appId,
      idempotencyKey: signal.idempotencyKey,
    });
  }

  function submitRewardSignal(signal: RewardSignalEvent): RewardFlowContext {
    return {
      flowId: createId('flow'),
      signal: {
        ...signal,
        timestamp: normalizeTimestamp(signal.timestamp),
      },
      receivedAt: nowIso(),
    };
  }

  function createAgentRecommendation(input: CreateAgentRecommendationInput): AgentRecommendation {
    return {
      recommendationId: input.recommendationId ?? createId('rec'),
      producingAgentId: input.producingAgentId,
      tenantId: input.tenantId,
      appId: input.appId,
      targetUserId: input.targetUserId,
      targetWallet: input.targetWallet,
      proposedAction: input.proposedAction,
      confidence: input.confidence,
      rationale: input.rationale,
      requiredPolicyChecks: input.requiredPolicyChecks ?? [
        'duplicate_event',
        'duplicate_recommendation',
        'tenant_quota',
        'app_quota',
        'per_user_reward_limit',
        'suspicious_velocity',
        'reward_budget',
        'token_settlement_eligibility',
        'minimum_confidence',
        'allowed_action_type',
      ],
      riskLevel: input.riskLevel ?? 'medium',
      createdAt: normalizeTimestamp(input.createdAt),
    };
  }

  function evaluateRewardPolicy(input: {
    context: RewardFlowContext;
    recommendation: AgentRecommendation;
  }): RewardPolicyResult {
    const { context, recommendation } = input;
    const checks: RewardPolicyCheckResult[] = [];
    const reasonCodes: string[] = [];
    const timestamp = signalTimestampMs(context.signal);
    const priorResult = store.seenSignals.get(context.signal.idempotencyKey);
    const settlementRequired = isSettlementRequired(recommendation.proposedAction);

    const duplicateEvent = Boolean(priorResult);
    checks.push({
      name: 'duplicate_event',
      status: duplicateEvent ? 'failed' : 'passed',
      detail: duplicateEvent
        ? 'Signal idempotency key was already processed.'
        : 'Signal idempotency key is new.',
    });
    if (duplicateEvent) reasonCodes.push('duplicate_event');

    const duplicateRecommendation = store.seenRecommendations.has(recommendation.recommendationId);
    checks.push({
      name: 'duplicate_recommendation',
      status: duplicateRecommendation ? 'failed' : 'passed',
      detail: duplicateRecommendation
        ? 'Recommendation id was already processed.'
        : 'Recommendation id is new.',
    });
    if (duplicateRecommendation) reasonCodes.push('duplicate_recommendation');

    const allowedAction = policy.allowedActionTypes.includes(recommendation.proposedAction.type);
    checks.push({
      name: 'allowed_action_type',
      status: allowedAction ? 'passed' : 'failed',
      detail: allowedAction ? 'Action type is allowlisted.' : 'Action type is not allowlisted.',
    });
    if (!allowedAction) reasonCodes.push('action_not_allowed');

    const minimumConfidencePassed = recommendation.confidence >= policy.minimumConfidence;
    checks.push({
      name: 'minimum_confidence',
      status: minimumConfidencePassed ? 'passed' : 'failed',
      detail: minimumConfidencePassed
        ? `Confidence ${recommendation.confidence.toFixed(2)} meets threshold.`
        : `Confidence ${recommendation.confidence.toFixed(2)} is below threshold ${policy.minimumConfidence.toFixed(2)}.`,
    });
    if (!minimumConfidencePassed) reasonCodes.push('minimum_confidence');

    const tenantQuotaPassed =
      !settlementRequired || settlementCountForTenant(context.signal.tenantId) < policy.tenantQuota;
    checks.push({
      name: 'tenant_quota',
      status: settlementRequired ? (tenantQuotaPassed ? 'passed' : 'failed') : 'skipped',
      detail: settlementRequired
        ? tenantQuotaPassed
          ? 'Tenant quota available.'
          : 'Tenant quota exhausted.'
        : 'Tenant quota applies only to settlement-required actions.',
    });
    if (!tenantQuotaPassed) reasonCodes.push('tenant_quota');

    const appQuotaPassed =
      !settlementRequired ||
      settlementCountForApp(context.signal.tenantId, context.signal.appId) < policy.appQuota;
    checks.push({
      name: 'app_quota',
      status: settlementRequired ? (appQuotaPassed ? 'passed' : 'failed') : 'skipped',
      detail: settlementRequired
        ? appQuotaPassed
          ? 'App quota available.'
          : 'App quota exhausted.'
        : 'App quota applies only to settlement-required actions.',
    });
    if (!appQuotaPassed) reasonCodes.push('app_quota');

    const perUserRewardLimitPassed =
      !settlementRequired ||
      settlementCountForUser(context.signal.userId, context.signal.walletAddress) <
        policy.userRewardLimit;
    checks.push({
      name: 'per_user_reward_limit',
      status: settlementRequired ? (perUserRewardLimitPassed ? 'passed' : 'failed') : 'skipped',
      detail: settlementRequired
        ? perUserRewardLimitPassed
          ? 'Per-user reward limit available.'
          : 'Per-user reward limit exhausted.'
        : 'Per-user reward limit applies only to settlement-required actions.',
    });
    if (!perUserRewardLimitPassed) reasonCodes.push('per_user_reward_limit');

    const velocity = previewScopeCounts(context.signal, timestamp);
    const suspiciousVelocityPassed = velocity.userCount <= policy.suspiciousVelocityMaxEvents;
    checks.push({
      name: 'suspicious_velocity',
      status: suspiciousVelocityPassed ? 'passed' : 'failed',
      detail: suspiciousVelocityPassed
        ? 'User activity is within the velocity threshold.'
        : 'User activity exceeded the suspicious velocity threshold.',
    });
    if (!suspiciousVelocityPassed) reasonCodes.push('suspicious_velocity');

    const rewardBudgetPassed =
      !settlementRequired ||
      settledTokenTotal() + parseTokenAmount(recommendation.proposedAction.tokenAmount) <=
        policy.rewardBudgetTokens;
    checks.push({
      name: 'reward_budget',
      status: settlementRequired ? (rewardBudgetPassed ? 'passed' : 'failed') : 'skipped',
      detail: settlementRequired
        ? rewardBudgetPassed
          ? 'Reward budget available.'
          : 'Reward budget exceeded.'
        : 'Reward budget applies only to settlement-required actions.',
    });
    if (!rewardBudgetPassed) reasonCodes.push('reward_budget');

    const tokenEligibilityPassed =
      !settlementRequired || Boolean(context.signal.walletAddress || recommendation.targetWallet);
    checks.push({
      name: 'token_settlement_eligibility',
      status: settlementRequired ? (tokenEligibilityPassed ? 'passed' : 'failed') : 'skipped',
      detail: settlementRequired
        ? tokenEligibilityPassed
          ? 'Settlement target is eligible.'
          : 'Token settlement requires a target wallet.'
        : 'Token settlement eligibility applies only to token rewards.',
    });
    if (!tokenEligibilityPassed) reasonCodes.push('token_settlement_eligibility');

    let decision: RewardPolicyDecision = 'approved';
    if (duplicateEvent || duplicateRecommendation) {
      decision = 'deferred';
    } else if (
      velocity.tenantCount > policy.tenantRateLimitMaxEvents ||
      velocity.appCount > policy.appRateLimitMaxEvents
    ) {
      decision = 'rate_limited';
      reasonCodes.push('rate_limited');
    } else if (
      !allowedAction ||
      !minimumConfidencePassed ||
      !tenantQuotaPassed ||
      !appQuotaPassed ||
      !perUserRewardLimitPassed ||
      !rewardBudgetPassed ||
      !tokenEligibilityPassed
    ) {
      decision = 'denied';
    } else if (!suspiciousVelocityPassed) {
      decision = 'manual_review';
    } else if (recommendation.riskLevel === 'high' || recommendation.riskLevel === 'critical') {
      decision = 'manual_review';
      reasonCodes.push('high_risk');
    }

    return {
      auditId: createId('audit'),
      decision,
      checks,
      reasonCodes,
      settlementEligible:
        decision === 'approved' && isSettlementRequired(recommendation.proposedAction),
      evaluatedAt: nowIso(),
    };
  }

  function approveRewardAction(input: {
    recommendation: AgentRecommendation;
    policyResult: RewardPolicyResult;
  }): RewardActionApproval | null {
    if (input.policyResult.decision !== 'approved') return null;
    return {
      approvalId: createId('approval'),
      recommendationId: input.recommendation.recommendationId,
      policyAuditId: input.policyResult.auditId,
      approvedAt: nowIso(),
      approvedBy: 'policy-engine',
      settlementRequired: input.policyResult.settlementEligible,
    };
  }

  async function settleRewardAction(input: {
    context: RewardFlowContext;
    recommendation: AgentRecommendation;
    approval: RewardActionApproval;
    settlementMode?: RewardSettlementMode;
  }): Promise<RewardSettlementReceipt | null> {
    if (!input.approval.settlementRequired) return null;

    const existing = store.settlementReceipts.get(input.context.signal.idempotencyKey);
    if (existing) return existing;

    const request: RewardSettlementRequest = {
      requestId: createId('request'),
      approvalId: input.approval.approvalId,
      recommendationId: input.recommendation.recommendationId,
      tenantId: input.context.signal.tenantId,
      appId: input.context.signal.appId,
      userId: input.context.signal.userId ?? input.recommendation.targetUserId,
      walletAddress: input.context.signal.walletAddress ?? input.recommendation.targetWallet,
      proposedAction: input.recommendation.proposedAction,
      idempotencyKey: input.context.signal.idempotencyKey,
      mode: input.settlementMode ?? 'mock',
    };

    const receipt = await settlementAdapter.settle(request);
    if (receipt.status !== 'failed') {
      store.settlementReceipts.set(request.idempotencyKey, receipt);
      store.settlementLedger.push(request);
    }
    return receipt;
  }

  async function recordAgentTelemetry(
    input: Omit<RewardTelemetryEvent, 'telemetryId' | 'timestamp'>,
  ) {
    const event: RewardTelemetryEvent = {
      telemetryId: createId('telemetry'),
      timestamp: nowIso(),
      ...input,
    };
    await telemetrySink.record(event);
    return event;
  }

  async function executeFlow(input: RunAgentRewardFlowInput): Promise<RewardFlowExecutionResult> {
    const context = submitRewardSignal(input.signal);
    const queueDepth = getQueueDepth(context.signal);
    const existing = store.seenSignals.get(context.signal.idempotencyKey);
    if (existing) {
      const dedupeTelemetry = await recordAgentTelemetry({
        flowId: context.flowId,
        tenantId: context.signal.tenantId,
        appId: context.signal.appId,
        userId: context.signal.userId,
        recommendationId: existing.recommendation.recommendationId,
        type: 'signal.deduped',
        data: {
          duplicateOfFlowId: existing.context.flowId,
          queueDepth,
        },
      });
      return {
        ...existing,
        context,
        telemetry: [...existing.telemetry, dedupeTelemetry],
        deduped: true,
      };
    }

    const telemetry: RewardTelemetryEvent[] = [];
    telemetry.push(
      await recordAgentTelemetry({
        flowId: context.flowId,
        tenantId: context.signal.tenantId,
        appId: context.signal.appId,
        userId: context.signal.userId,
        recommendationId: input.recommendation.recommendationId,
        type: 'signal.accepted',
        data: { eventType: context.signal.eventType, queueDepth },
      }),
    );

    const policyResult = evaluateRewardPolicy({
      context,
      recommendation: input.recommendation,
    });
    if (policyResult.decision !== 'deferred') {
      recordScopeTimestamp(context.signal, signalTimestampMs(context.signal));
    }

    const telemetryType =
      policyResult.decision === 'approved'
        ? 'recommendation.approved'
        : policyResult.decision === 'manual_review'
          ? 'recommendation.manual_review'
          : policyResult.decision === 'rate_limited'
            ? 'policy.rate_limited'
            : 'recommendation.denied';
    telemetry.push(
      await recordAgentTelemetry({
        flowId: context.flowId,
        tenantId: context.signal.tenantId,
        appId: context.signal.appId,
        userId: context.signal.userId,
        recommendationId: input.recommendation.recommendationId,
        type: telemetryType,
        data: {
          decision: policyResult.decision,
          reasonCodes: policyResult.reasonCodes,
          confidence: input.recommendation.confidence,
        },
      }),
    );

    const approval = approveRewardAction({
      recommendation: input.recommendation,
      policyResult,
    });

    let settlement: RewardSettlementReceipt | null = null;
    if (approval?.settlementRequired) {
      telemetry.push(
        await recordAgentTelemetry({
          flowId: context.flowId,
          tenantId: context.signal.tenantId,
          appId: context.signal.appId,
          userId: context.signal.userId,
          recommendationId: input.recommendation.recommendationId,
          type: 'settlement.attempted',
          data: {
            mode: input.settlementMode ?? 'mock',
            actionType: input.recommendation.proposedAction.type,
          },
        }),
      );
      settlement = await settleRewardAction({
        context,
        recommendation: input.recommendation,
        approval,
        settlementMode: input.settlementMode,
      });
      telemetry.push(
        await recordAgentTelemetry({
          flowId: context.flowId,
          tenantId: context.signal.tenantId,
          appId: context.signal.appId,
          userId: context.signal.userId,
          recommendationId: input.recommendation.recommendationId,
          type: settlement?.status === 'failed' ? 'settlement.failed' : 'settlement.succeeded',
          data: {
            status: settlement?.status ?? 'skipped',
            failureReason: settlement?.failureReason,
          },
        }),
      );
    }

    telemetry.push(
      await recordAgentTelemetry({
        flowId: context.flowId,
        tenantId: context.signal.tenantId,
        appId: context.signal.appId,
        userId: context.signal.userId,
        recommendationId: input.recommendation.recommendationId,
        type: 'agent.confidence_outcome',
        data: {
          confidence: input.recommendation.confidence,
          decision: policyResult.decision,
          settlementStatus: settlement?.status ?? null,
        },
      }),
    );

    const result: RewardFlowExecutionResult = {
      context,
      recommendation: input.recommendation,
      policyResult,
      approval,
      settlement,
      telemetry,
      deduped: false,
    };

    store.seenSignals.set(context.signal.idempotencyKey, result);
    store.seenRecommendations.add(input.recommendation.recommendationId);
    return result;
  }

  async function runAgentRewardFlow(
    input: RunAgentRewardFlowInput,
  ): Promise<RewardFlowExecutionResult> {
    const job = {
      tenantId: input.signal.tenantId,
      appId: input.signal.appId,
      idempotencyKey: input.signal.idempotencyKey,
    };

    if (!scalability?.run) {
      return executeFlow(input);
    }

    return scalability.run(job, async () => executeFlow(input));
  }

  return {
    submitRewardSignal,
    createAgentRecommendation,
    evaluateRewardPolicy,
    approveRewardAction,
    settleRewardAction,
    recordAgentTelemetry,
    runAgentRewardFlow,
  };
}

const defaultAgentRewardFlow = createAgentRewardFlow();

export const submitRewardSignal = defaultAgentRewardFlow.submitRewardSignal;
export const createAgentRecommendation = defaultAgentRewardFlow.createAgentRecommendation;
export const evaluateRewardPolicy = defaultAgentRewardFlow.evaluateRewardPolicy;
export const approveRewardAction = defaultAgentRewardFlow.approveRewardAction;
export const settleRewardAction = defaultAgentRewardFlow.settleRewardAction;
export const recordAgentTelemetry = defaultAgentRewardFlow.recordAgentTelemetry;
export const runAgentRewardFlow = defaultAgentRewardFlow.runAgentRewardFlow;
