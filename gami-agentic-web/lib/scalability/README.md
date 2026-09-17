# Agentic scalability layer

This module adds a dependency-light scalability layer for agent task execution.

## What it provides

- `AgentTaskManager`: bounded-concurrency queue/worker manager with priority scheduling, backpressure, retry with exponential backoff + jitter, DLQ routing, and idempotency-key dedupe.
- Per-scope (`tenantId + appId`) limits: requests/minute, queued depth, in-flight caps, and daily quota.
- `TtlCache`: in-memory TTL cache for context/telemetry reads with invalidation hooks (`onInvalidate`).
- Health hooks: queue depth, in-flight, DLQ depth, completed/failed/retried counters exposed via `getHealthSnapshot()` and optional metrics sink (`gauge`, `increment`, `timing`).

## Current integration

`lib/mcp/process-quest-message.ts` now routes quest processing through the shared task manager (`getAgentTaskManager()`), so MCP calls can pass optional:

- `tenantId`
- `appId`
- `idempotencyKey`
- `priority`

If `tenantId`/`appId` are omitted, the runtime defaults to `tenantId: "default"` and `appId: "agentic-web"` for quota and idempotency scope.

When `idempotencyKey` is omitted, a deterministic key is derived from `sessionId + message`.
Idempotency is enforced per scope (`tenantId + appId`) so identical keys from different tenants/apps do not collide.
Settled idempotency records are retained for a bounded replay window (default 10 minutes) and then expire.

## Horizontal scaling seam

The default backend is in-memory and stateless at the API layer. The abstraction boundaries are in `agent-task-manager.ts` (`QueueBackend`, scope limiter, idempotency map, metrics sink), so external backends (Redis/Postgres/Firestore) can be introduced without changing MCP tool contracts.

## Example

```ts
const manager = getAgentTaskManager();
const job = await manager.enqueue({
  tenantId: 'partner-a',
  appId: 'agentic-web',
  idempotencyKey: 'evt_123',
  priority: 'high',
  execute: async ({ attempt }) => ({ ok: true, attempt }),
});

const result = await job.promise;
```
