import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAgentRecommendation,
  createAgentRewardFlow,
  createInMemoryTelemetrySink,
  createMockSettlementAdapter,
  submitRewardSignal,
  type RewardActionProposal,
  type RewardRiskLevel,
  type RewardSignalEvent,
} from './index';

function makeSignal(overrides: Partial<RewardSignalEvent> = {}): RewardSignalEvent {
  return {
    eventId: overrides.eventId ?? 'evt_1',
    tenantId: overrides.tenantId ?? 'tenant_1',
    appId: overrides.appId ?? 'app_1',
    userId: overrides.userId ?? 'user_1',
    walletAddress: overrides.walletAddress ?? '0x1111111111111111111111111111111111111111',
    eventType: overrides.eventType ?? 'quest_completed',
    timestamp: overrides.timestamp ?? '2026-09-17T18:00:00.000Z',
    source: overrides.source ?? 'quest-engine',
    payload: overrides.payload ?? { questId: 'quest_alpha', xp: 250 },
    idempotencyKey: overrides.idempotencyKey ?? 'idem_1',
  };
}

interface RecommendationOverrides {
  recommendationId?: string;
  producingAgentId?: string;
  proposedAction?: RewardActionProposal;
  confidence?: number;
  rationale?: string;
  riskLevel?: RewardRiskLevel;
}

function makeRecommendation(signal: RewardSignalEvent, overrides: RecommendationOverrides = {}) {
  return createAgentRecommendation({
    recommendationId: overrides.recommendationId ?? 'rec_1',
    producingAgentId: overrides.producingAgentId ?? 'quest-agent',
    tenantId: signal.tenantId,
    appId: signal.appId,
    targetUserId: signal.userId,
    targetWallet: signal.walletAddress,
    proposedAction: overrides.proposedAction ?? {
      type: 'propose_token_reward',
      tokenAmount: '25',
      tokenSymbol: 'GAMI',
      questId: 'quest_alpha',
    },
    confidence: overrides.confidence ?? 0.92,
    rationale: overrides.rationale ?? 'User completed a verified quest.',
    riskLevel: overrides.riskLevel ?? 'low',
  });
}

void test('event intake creates typed flow context', () => {
  const signal = makeSignal();
  const context = submitRewardSignal(signal);

  assert.equal(context.signal.eventId, signal.eventId);
  assert.equal(context.signal.idempotencyKey, signal.idempotencyKey);
  assert.match(context.flowId, /^flow_/);
  assert.equal(context.signal.timestamp, '2026-09-17T18:00:00.000Z');
});

void test('duplicate idempotency key is deduped and does not double settle', async () => {
  const flow = createAgentRewardFlow();
  const signal = makeSignal();
  const recommendation = makeRecommendation(signal);

  const first = await flow.runAgentRewardFlow({ signal, recommendation });
  const second = await flow.runAgentRewardFlow({ signal, recommendation });

  assert.equal(first.deduped, false);
  assert.equal(second.deduped, true);
  assert.equal(first.settlement?.settlementId, second.settlement?.settlementId);
});

void test('low-confidence recommendation is denied', async () => {
  const flow = createAgentRewardFlow();
  const signal = makeSignal({ idempotencyKey: 'idem_low_confidence' });
  const recommendation = makeRecommendation(signal, {
    recommendationId: 'rec_low_confidence',
    confidence: 0.2,
  });

  const result = await flow.runAgentRewardFlow({ signal, recommendation });

  assert.equal(result.policyResult.decision, 'denied');
  assert.equal(result.approval, null);
  assert.equal(result.settlement, null);
});

void test('high-risk recommendation requires manual review', async () => {
  const flow = createAgentRewardFlow();
  const signal = makeSignal({ idempotencyKey: 'idem_high_risk' });
  const recommendation = makeRecommendation(signal, {
    recommendationId: 'rec_high_risk',
    riskLevel: 'high',
  });

  const result = await flow.runAgentRewardFlow({ signal, recommendation });

  assert.equal(result.policyResult.decision, 'manual_review');
  assert.equal(result.settlement, null);
});

void test('valid recommendation proceeds to settlement', async () => {
  const flow = createAgentRewardFlow();
  const signal = makeSignal({ idempotencyKey: 'idem_valid' });
  const recommendation = makeRecommendation(signal, {
    recommendationId: 'rec_valid',
  });

  const result = await flow.runAgentRewardFlow({ signal, recommendation });

  assert.equal(result.policyResult.decision, 'approved');
  assert.equal(result.approval?.approvedBy, 'policy-engine');
  assert.equal(result.settlement?.status, 'mock_settled');
});

void test('settlement failure emits telemetry', async () => {
  const telemetry = createInMemoryTelemetrySink();
  const flow = createAgentRewardFlow({
    telemetrySink: telemetry,
    settlementAdapter: createMockSettlementAdapter({
      failIdempotencyKeys: ['idem_failure'],
    }),
  });
  const signal = makeSignal({ idempotencyKey: 'idem_failure' });
  const recommendation = makeRecommendation(signal, {
    recommendationId: 'rec_failure',
  });

  const result = await flow.runAgentRewardFlow({ signal, recommendation });

  assert.equal(result.settlement?.status, 'failed');
  assert.equal(
    telemetry.events.some((event) => event.type === 'settlement.failed'),
    true,
  );
});

void test('rate-limited tenant or app does not settle', async () => {
  const flow = createAgentRewardFlow({
    policyConfig: {
      tenantRateLimitMaxEvents: 1,
      appRateLimitMaxEvents: 1,
    },
  });
  const firstSignal = makeSignal({ idempotencyKey: 'idem_rate_1' });
  const secondSignal = makeSignal({
    eventId: 'evt_rate_2',
    idempotencyKey: 'idem_rate_2',
  });

  await flow.runAgentRewardFlow({
    signal: firstSignal,
    recommendation: makeRecommendation(firstSignal, { recommendationId: 'rec_rate_1' }),
  });
  const second = await flow.runAgentRewardFlow({
    signal: secondSignal,
    recommendation: makeRecommendation(secondSignal, { recommendationId: 'rec_rate_2' }),
  });

  assert.equal(second.policyResult.decision, 'rate_limited');
  assert.equal(second.settlement, null);
});

void test('app quota stays scoped to the tenant and app pair', async () => {
  const flow = createAgentRewardFlow({
    policyConfig: {
      appQuota: 1,
    },
  });
  const sharedAppId = 'shared_app';
  const firstSignal = makeSignal({
    tenantId: 'tenant_alpha',
    appId: sharedAppId,
    idempotencyKey: 'idem_app_quota_1',
  });
  const secondSignal = makeSignal({
    eventId: 'evt_app_quota_2',
    tenantId: 'tenant_beta',
    appId: sharedAppId,
    userId: 'user_2',
    walletAddress: '0x2222222222222222222222222222222222222222',
    idempotencyKey: 'idem_app_quota_2',
  });

  const first = await flow.runAgentRewardFlow({
    signal: firstSignal,
    recommendation: makeRecommendation(firstSignal, {
      recommendationId: 'rec_app_quota_1',
    }),
  });
  const second = await flow.runAgentRewardFlow({
    signal: secondSignal,
    recommendation: makeRecommendation(secondSignal, {
      recommendationId: 'rec_app_quota_2',
    }),
  });

  assert.equal(first.policyResult.decision, 'approved');
  assert.equal(second.policyResult.decision, 'approved');
  assert.equal(second.settlement?.status, 'mock_settled');
});

void test('suspicious velocity takes precedence over tenant and app rate limiting', async () => {
  const flow = createAgentRewardFlow({
    policyConfig: {
      suspiciousVelocityMaxEvents: 1,
      tenantRateLimitMaxEvents: 1,
      appRateLimitMaxEvents: 1,
    },
  });
  const firstSignal = makeSignal({
    idempotencyKey: 'idem_velocity_1',
  });
  const secondSignal = makeSignal({
    eventId: 'evt_velocity_2',
    idempotencyKey: 'idem_velocity_2',
  });

  await flow.runAgentRewardFlow({
    signal: firstSignal,
    recommendation: makeRecommendation(firstSignal, {
      recommendationId: 'rec_velocity_1',
      proposedAction: {
        type: 'grant_xp',
        xp: 250,
        questId: 'quest_velocity',
      },
    }),
  });
  const second = await flow.runAgentRewardFlow({
    signal: secondSignal,
    recommendation: makeRecommendation(secondSignal, {
      recommendationId: 'rec_velocity_2',
      proposedAction: {
        type: 'grant_xp',
        xp: 250,
        questId: 'quest_velocity',
      },
    }),
  });

  assert.equal(second.policyResult.decision, 'manual_review');
  assert.equal(
    second.policyResult.checks.find((check) => check.name === 'suspicious_velocity')?.status,
    'failed',
  );
});

void test('concurrent retries collapse to a single settlement execution', async () => {
  let settleCount = 0;
  const flow = createAgentRewardFlow({
    settlementAdapter: {
      async settle(request) {
        settleCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          settlementId: `settlement_${settleCount}`,
          requestId: request.requestId,
          idempotencyKey: request.idempotencyKey,
          status: 'mock_settled',
          settledAt: '2026-09-17T18:00:00.000Z',
        };
      },
    },
  });
  const signal = makeSignal({
    eventId: 'evt_concurrent',
    idempotencyKey: 'idem_concurrent',
  });
  const recommendation = makeRecommendation(signal, {
    recommendationId: 'rec_concurrent',
  });

  const [first, second] = await Promise.all([
    flow.runAgentRewardFlow({ signal, recommendation }),
    flow.runAgentRewardFlow({ signal, recommendation }),
  ]);

  assert.equal(settleCount, 1);
  assert.equal(first.settlement?.settlementId, second.settlement?.settlementId);
  assert.equal(first.context.flowId, second.context.flowId);
  assert.equal(first.deduped, false);
  assert.equal(second.deduped, true);
});

void test('retry-safe flow does not double-settle rewards', async () => {
  const flow = createAgentRewardFlow();
  const signal = makeSignal({
    eventId: 'evt_retry',
    idempotencyKey: 'idem_retry',
  });
  const recommendation = makeRecommendation(signal, {
    recommendationId: 'rec_retry',
    proposedAction: {
      type: 'propose_token_reward',
      questId: 'quest_retry',
      tokenAmount: '12',
      tokenSymbol: 'GAMI',
    },
  });

  const first = await flow.runAgentRewardFlow({
    signal,
    recommendation,
    settlementMode: 'dry_run',
  });
  const second = await flow.runAgentRewardFlow({
    signal,
    recommendation,
    settlementMode: 'dry_run',
  });

  assert.equal(first.settlement?.status, 'dry_run');
  assert.equal(first.settlement?.settlementId, second.settlement?.settlementId);
});
