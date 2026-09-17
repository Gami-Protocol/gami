import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInMemoryRewardFlowStateStore,
  createMockSettlementAdapter,
  InMemoryTelemetrySink,
  runAgentRewardFlow,
  submitRewardSignal,
} from '@/lib/agent-flow';
import type { AgentRecommendation, RewardSignalEvent } from '@/lib/agent-flow';

function buildEvent(overrides: Partial<RewardSignalEvent> = {}): RewardSignalEvent {
  return {
    eventId: overrides.eventId ?? 'evt-1',
    tenantId: overrides.tenantId ?? 'tenant-a',
    appId: overrides.appId ?? 'app-a',
    userId: overrides.userId ?? 'user-1',
    walletAddress: overrides.walletAddress ?? '0x1111111111111111111111111111111111111111',
    eventType: overrides.eventType ?? 'quest_completed',
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    source: overrides.source ?? 'wallet_app',
    payload: overrides.payload ?? { questId: 'quest-1' },
    idempotencyKey: overrides.idempotencyKey ?? 'idem-1',
  };
}

function buildRecommendationInput(
  overrides: Partial<
    Omit<AgentRecommendation, 'tenantId' | 'appId' | 'userId' | 'walletAddress' | 'createdAt'>
  > = {},
): Omit<AgentRecommendation, 'tenantId' | 'appId' | 'userId' | 'walletAddress' | 'createdAt'> {
  return {
    recommendationId: overrides.recommendationId ?? 'rec-1',
    agentId: overrides.agentId ?? 'agent-risk-engine',
    proposedAction: overrides.proposedAction ?? 'propose_token_reward',
    confidence: overrides.confidence ?? 0.9,
    rationale: overrides.rationale ?? 'Grant 12 GAMI for quest completion',
    requiredPolicyChecks: overrides.requiredPolicyChecks ?? [
      'minimum_confidence',
      'reward_budget',
      'token_settlement_eligibility',
    ],
    riskLevel: overrides.riskLevel ?? 'low',
  };
}

void test('event intake creates typed flow context', () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const event = buildEvent();

  const context = submitRewardSignal(event, stateStore);

  assert.equal(context.event.eventType, 'quest_completed');
  assert.equal(context.targetIdentity, event.walletAddress);
  assert.equal(context.dedupedEvent, false);
});

void test('duplicate idempotency key is deduped', () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const event = buildEvent();

  const first = submitRewardSignal(event, stateStore);
  const second = submitRewardSignal(event, stateStore);

  assert.equal(first.dedupedEvent, false);
  assert.equal(second.dedupedEvent, true);
  assert.equal(stateStore.tenantCounts.get(event.tenantId), 1);
});

void test('low-confidence recommendation is denied', async () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const result = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-low-confidence' }),
    recommendationInput: buildRecommendationInput({
      recommendationId: 'rec-low-confidence',
      confidence: 0.2,
    }),
    stateStore,
    settlementAdapter: createMockSettlementAdapter({ mode: 'mock-success' }),
    telemetrySink: new InMemoryTelemetrySink(),
    approverId: 'policy-engine-1',
  });

  assert.equal(result.policy.decision, 'denied');
  assert.equal(result.approved, false);
  assert.equal(result.settlement, undefined);
});

void test('high-risk recommendation requires manual review', async () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const result = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-manual-review' }),
    recommendationInput: buildRecommendationInput({
      recommendationId: 'rec-manual-review',
      riskLevel: 'high',
      confidence: 0.95,
    }),
    stateStore,
    settlementAdapter: createMockSettlementAdapter({ mode: 'mock-success' }),
    telemetrySink: new InMemoryTelemetrySink(),
    approverId: 'policy-engine-1',
  });

  assert.equal(result.policy.decision, 'requires_manual_review');
  assert.equal(result.approved, false);
  assert.equal(result.settlement, undefined);
});

void test('valid recommendation proceeds to settlement', async () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const result = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-valid' }),
    recommendationInput: buildRecommendationInput({ recommendationId: 'rec-valid' }),
    stateStore,
    settlementAdapter: createMockSettlementAdapter({ mode: 'mock-success' }),
    telemetrySink: new InMemoryTelemetrySink(),
    approverId: 'policy-engine-1',
  });

  assert.equal(result.policy.decision, 'approved');
  assert.equal(result.approved, true);
  assert.equal(result.settlement?.status, 'completed');
});

void test('settlement failure emits telemetry', async () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const sink = new InMemoryTelemetrySink();

  const result = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-failure' }),
    recommendationInput: buildRecommendationInput({ recommendationId: 'rec-failure' }),
    stateStore,
    settlementAdapter: createMockSettlementAdapter({ mode: 'mock-failure' }),
    telemetrySink: sink,
    approverId: 'policy-engine-1',
  });

  assert.equal(result.settlement?.status, 'failed');
  assert.equal(
    sink.events.some((event) => event.type === 'settlement_failed'),
    true,
  );
});

void test('rate-limited tenant/app does not settle', async () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const result = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-rate-limited' }),
    recommendationInput: buildRecommendationInput({ recommendationId: 'rec-rate-limited' }),
    stateStore,
    settlementAdapter: createMockSettlementAdapter({ mode: 'mock-success' }),
    telemetrySink: new InMemoryTelemetrySink(),
    approverId: 'policy-engine-1',
    policyConfig: {
      tenantQuotaPerWindow: 0,
    },
  });

  assert.equal(result.policy.decision, 'rate_limited');
  assert.equal(result.settlement, undefined);
});

void test('agent cannot approve its own recommendation', async () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const result = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-self-approval' }),
    recommendationInput: buildRecommendationInput({
      recommendationId: 'rec-self-approval',
      agentId: 'agent-self',
    }),
    stateStore,
    settlementAdapter: createMockSettlementAdapter({ mode: 'mock-success' }),
    telemetrySink: new InMemoryTelemetrySink(),
    approverId: 'agent-self',
  });

  assert.equal(result.policy.decision, 'denied');
  assert.equal(result.approved, false);
  assert.equal(result.settlement, undefined);
});

void test('retry-safe flow does not double-settle rewards', async () => {
  const stateStore = createInMemoryRewardFlowStateStore();
  const settlementAdapter = createMockSettlementAdapter({ mode: 'mock-success' });

  const first = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-retry-safe' }),
    recommendationInput: buildRecommendationInput({ recommendationId: 'rec-retry-safe' }),
    stateStore,
    settlementAdapter,
    telemetrySink: new InMemoryTelemetrySink(),
    approverId: 'policy-engine-1',
  });

  const second = await runAgentRewardFlow({
    event: buildEvent({ idempotencyKey: 'idem-retry-safe' }),
    recommendationInput: buildRecommendationInput({ recommendationId: 'rec-retry-safe' }),
    stateStore,
    settlementAdapter,
    telemetrySink: new InMemoryTelemetrySink(),
    approverId: 'policy-engine-1',
  });

  assert.equal(first.settlement?.status, 'completed');
  assert.equal(second.settlement, undefined);
  assert.equal(stateStore.settledIdempotencyKeys.size, 1);
});
