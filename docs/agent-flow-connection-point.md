# Agent flow connection point

## Purpose

`/lib/agent-flow` is the canonical bridge between reward signals, agent recommendations, deterministic policy, settlement preparation, and telemetry. Agents can propose typed actions, but they cannot approve or settle them directly.

## End-to-end flow

1. `submitRewardSignal(...)` normalizes a typed reward event into a flow context.
2. `createAgentRecommendation(...)` turns an agent proposal into structured data.
3. `evaluateRewardPolicy(...)` applies deterministic checks for duplicates, confidence, limits, quotas, velocity, budget, allowed actions, and token eligibility.
4. `approveRewardAction(...)` only emits a policy-engine approval when the policy decision is `approved`.
5. `settleRewardAction(...)` prepares replay-safe settlement through an injected adapter.
6. `recordAgentTelemetry(...)` emits audit-friendly flow telemetry.
7. `runAgentRewardFlow(...)` orchestrates the full path and short-circuits duplicate idempotency keys.

## Agent vs. policy responsibility

- Agents may recommend `grant_xp`, `mark_quest_complete`, `propose_token_reward`, `flag_suspicious_activity`, `throttle_reward_flow`, `request_human_review`, or `update_campaign_strategy`.
- Agents never transfer tokens or mutate reward state directly.
- Agents never approve their own recommendations. Approval is always stamped as `policy-engine`.
- Payout-like actions are only eligible for settlement after deterministic approval.

## Settlement boundary

The module ships with a mock settlement adapter and supports three non-production modes:

- `dry_run`: policy-approved request is exercised without payout side effects
- `mock`: returns mock completion for tests and local integration
- `onchain_prepare`: marks the request as `pending_onchain` so future token execution can plug in later

No Solidity contracts are deployed or modified here. Future token merge work should replace the adapter with a production settlement implementation that reads a token-address registry and executes after the same policy gate.

## Telemetry loop

Telemetry events are emitted for:

- accepted and deduped signals
- approved, denied, manual-review, and rate-limited recommendations
- settlement attempts
- settlement success and failure
- confidence versus outcome

If a future worker or queue layer provides queue depth, `runAgentRewardFlow(...)` includes that value in emitted telemetry.

## Idempotency model

- Every signal carries an `idempotencyKey`.
- The flow stores the first completed result for that key.
- Replays return the prior settlement receipt instead of creating a second settlement.
- The mock settlement adapter also reuses receipts per idempotency key.

This keeps duplicate events or retries from double-paying rewards.

## Scalability integration

The repository does not currently contain a generic reward queue or worker system. To avoid creating a second queue implementation, `/lib/agent-flow` exposes an optional `RewardScalabilityAdapter` with hooks for:

- bounded worker execution via `run(...)`
- queue-depth reporting
- retry-delay calculation
- dead-letter handling

Existing integrations can inject that adapter later without changing the policy or settlement API surface.

## Test coverage

The accompanying unit tests cover:

- typed event intake
- duplicate idempotency dedupe
- low-confidence denial
- manual review for high risk
- successful settlement
- settlement failure telemetry
- tenant/app rate limiting
- retry-safe non-duplication of settlement

Run them with:

```sh
npm run test:agent-flow
```

## Repository link

This connection point complements the wallet reward surface in `/lib/gami-sdk.ts`, the agent chat surface in `/gami-agentic-web/lib/mcp/`, and future token merge work that can provide a real settlement adapter without bypassing deterministic policy.
