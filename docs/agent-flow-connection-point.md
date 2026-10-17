# Agent Flow Connection Point

This document defines the canonical connection point between reward signal ingestion and agent-assisted reward handling in Gami.

## End-to-end flow

1. `submitRewardSignal(...)` ingests typed reward events with `eventId`, tenant/app scope, identity, payload, timestamp, and idempotency key.
2. `createAgentRecommendation(...)` creates typed agent recommendations (XP, quest, token reward proposal, throttling, review, strategy update).
3. `evaluateRewardPolicy(...)` runs deterministic checks and emits an auditable policy result.
4. `approveRewardAction(...)` enforces separation of duties (agents cannot self-approve).
5. `settleRewardAction(...)` invokes a settlement adapter boundary (dry run/mock/pending/completed/failed/deduped).
6. `recordAgentTelemetry(...)` emits structured flow telemetry.
7. `runAgentRewardFlow(...)` orchestrates the full sequence and returns a typed execution result.

## Agent vs policy responsibility

- Agents can **propose** actions as typed recommendations.
- Agents cannot directly transfer tokens or mutate payout state.
- Deterministic policy is the only approval gate for payout-like actions.
- Agent IDs cannot approve their own recommendations.

## Settlement boundary

`RewardSettlementAdapter` isolates settlement from the flow:

- supports dry-run and mock modes,
- supports pending on-chain receipts,
- supports completed and failed receipts,
- enforces replay safety via idempotency keys.

No production token transfer logic is hard-coded in this module, and no Solidity contracts are changed.

## Telemetry loop

The flow emits telemetry for:

- signal intake / dedupe,
- recommendation creation,
- policy evaluation and failure,
- rate limiting,
- settlement attempt/success/failure,
- end-to-end latency,
- queue depth (when provided by a scalability adapter),
- confidence and policy outcome.

These telemetry events can be consumed by agent/web surfaces for feedback and tuning.

## Idempotency model

- Signal-level idempotency: `RewardSignalEvent.idempotencyKey` dedupes repeated event ingestion.
- Settlement-level idempotency: settlement keys combine event idempotency and recommendation ID so retries do not double-settle.

## Scalability integration point

No standalone queue system is introduced in this module.

Instead, `AgentFlowScalabilityAdapter` exposes integration hooks:

- `runWithControls(...)` for external worker/queue control planes,
- `getQueueDepth(...)` for telemetry,
- tenant/app/idempotency metadata for bounded concurrency, retry/backoff, and dead-letter orchestration in an external scalability layer.

## Future token merge integration

For the base token merge and reward rollout, plug production logic behind `RewardSettlementAdapter` and token-address registry lookups. The connection-point API stays stable while settlement internals evolve from mock/dry-run to on-chain execution.
