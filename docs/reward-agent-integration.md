# Reward + agent integration design

This design keeps agents advisory while preserving deterministic, auditable reward settlement.

## End-to-end flow

1. **Event ingestion**
   - User actions enter backend surfaces (MCP quest calls, Supabase events, sale/KYC updates).
2. **XP accrual**
   - Deterministic quest logic updates XP/level state (`resolveIntent`, backend tables).
3. **Quest completion**
   - Completion events are written to a ledger/receipt model with stable ids.
4. **Reward eligibility**
   - Policy layer checks allowlist criteria (KYC phase, anti-abuse, campaign constraints, quotas).
5. **Token distribution**
   - Settlement worker converts approved XP rewards to token payouts and submits on-chain transfer/claim actions.
6. **Telemetry feedback to agents**
   - Settlement receipts (queued/settled/failed + tx hash) are exposed as read models so agents can explain status without executing settlement.

## Advisory-vs-deterministic boundary

### Agent responsibility (proposal)

- Suggest quest actions
- Suggest candidate reward intent (`who`, `why`, `amount basis`)
- Explain current status from telemetry

### Deterministic policy responsibility (approval + settlement)

- Validate eligibility and anti-abuse gates
- Enforce rate limits/quota/idempotency
- Approve/deny reward proposals with explicit reason codes
- Commit settlement receipt + nonce before chain broadcast
- Execute payout using canonical chain registry addresses

**Rule:** no direct reward payout can be triggered from free-form agent output. Agent outputs are untrusted inputs into a deterministic approval path.

## Data contracts (TypeScript)

```ts
export type RewardProposal = {
  proposalId: string;
  tenantId: string;
  appId: string;
  sessionId: string;
  actorWallet?: `0x${string}`;
  source: 'quest_completion' | 'referral' | 'campaign_bonus';
  xpBasis: number;
  requestedTokenAmount: string;
  reason: string;
  createdAt: string;
};

export type RewardApproval = {
  approvalId: string;
  proposalId: string;
  policyVersion: string;
  approved: boolean;
  denyCode?:
    | 'RATE_LIMITED'
    | 'QUOTA_EXCEEDED'
    | 'KYC_REQUIRED'
    | 'DUPLICATE'
    | 'RISK_FLAGGED'
    | 'INVALID_INPUT';
  idempotencyKey: string;
  settlementNonce: string;
  reviewedAt: string;
};

export type SettlementReceipt = {
  receiptId: string;
  approvalId: string;
  chain: 'base' | 'baseSepolia';
  tokenAddress: `0x${string}`;
  beneficiary: `0x${string}`;
  amount: string;
  status: 'queued' | 'settling' | 'settled' | 'failed';
  txHash?: `0x${string}`;
  attempt: number;
  errorCode?: 'RPC_ERROR' | 'REORG_REVERT' | 'NONCE_CONFLICT' | 'TIMEOUT';
  createdAt: string;
  updatedAt: string;
};
```

## Failure modes and controls

| Failure mode | Control |
|---|---|
| Double payout | Mandatory idempotency key + persisted settlement nonce; duplicate request returns prior receipt |
| Replay of old proposal | Proposal TTL and status checks; approval references policy version and immutable proposal hash |
| Chain reorg | Settlement finality policy (confirmations threshold) and revalidation loop before terminal success |
| Tenant abuse / burst traffic | Per-tenant/per-app request rate limits, queue caps, and daily quota controls |
| Partial failure (DB write succeeds, tx submit fails) | Retry with exponential backoff + jitter; DLQ with manual/operator replay path |
| Partial failure (tx sent, response lost) | Reconciliation pass by nonce/beneficiary/amount and receipt backfill |
| LLM hallucinated action | Deterministic schema validation + policy gate, never direct execution |

## Scalability module linkage

The implementation in `/home/runner/work/gami/gami/gami-agentic-web/lib/scalability` provides:

- bounded-concurrency queue workers
- per-scope rate limiting and quota
- retries with exponential backoff + jitter
- DLQ capture
- idempotent task handling
- TTL cache + invalidation hooks
- queue/latency/failure metrics hooks

See `/home/runner/work/gami/gami/gami-agentic-web/lib/scalability/README.md` for usage.
