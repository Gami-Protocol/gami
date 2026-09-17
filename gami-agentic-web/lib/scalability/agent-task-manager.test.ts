import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import { AgentTaskManager, TaskRejectedError, TtlCache } from './agent-task-manager';

void test('bounded concurrency and priority scheduling', async () => {
  const manager = new AgentTaskManager({
    concurrency: 2,
    maxQueueDepth: 20,
    scopeLimits: {
      requestsPerMinute: 100,
      maxQueued: 20,
      maxInFlight: 20,
      maxDaily: 10_000,
    },
  });

  let inFlight = 0;
  let maxObserved = 0;
  const order: string[] = [];

  const mk = async (name: string, waitMs: number) => {
    const job = await manager.enqueue({
      tenantId: 'tenant-a',
      appId: 'agentic-web',
      idempotencyKey: `id-${name}`,
      priority: name === 'high' ? 'high' : 'normal',
      execute: async () => {
        inFlight += 1;
        maxObserved = Math.max(maxObserved, inFlight);
        order.push(`start:${name}`);
        await sleep(waitMs);
        order.push(`end:${name}`);
        inFlight -= 1;
        return name;
      },
    });
    return job.promise;
  };

  const promises = [mk('a', 30), mk('b', 30), mk('high', 10), mk('d', 5)];
  const results = await Promise.all(promises);

  assert.equal(maxObserved <= 2, true);
  assert.equal(results.includes('high'), true);
  assert.equal(order.includes('start:high'), true);
});

void test('retry with exponential backoff and jitter eventually settles', async () => {
  let logicalNow = 1000;
  const manager = new AgentTaskManager({
    concurrency: 1,
    now: () => logicalNow,
    maxQueueDepth: 10,
    random: () => 0,
    schedule: (delayMs, callback) => {
      logicalNow += delayMs;
      callback();
    },
    retryPolicy: {
      baseDelayMs: 10,
      maxDelayMs: 30,
      jitterRatio: 0.5,
    },
    scopeLimits: {
      requestsPerMinute: 100,
      maxQueued: 10,
      maxInFlight: 10,
      maxDaily: 1_000,
    },
  });

  let attempts = 0;
  const job = await manager.enqueue({
    tenantId: 'tenant-a',
    appId: 'agentic-web',
    idempotencyKey: 'retry-case',
    maxAttempts: 3,
    execute: async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error('transient');
      }
      return 'ok';
    },
  });

  const result = await job.promise;
  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
  assert.equal(manager.getHealthSnapshot().retried, 2);
});

void test('idempotency dedupes retried submissions', async () => {
  const manager = new AgentTaskManager({
    concurrency: 1,
    maxQueueDepth: 10,
    scopeLimits: {
      requestsPerMinute: 100,
      maxQueued: 10,
      maxInFlight: 10,
      maxDaily: 1_000,
    },
  });

  let runs = 0;
  const [a, b] = await Promise.all([
    manager.enqueue({
      tenantId: 'tenant-a',
      appId: 'agentic-web',
      idempotencyKey: 'same-key',
      execute: async () => {
        runs += 1;
        await sleep(20);
        return { ok: true };
      },
    }),
    manager.enqueue({
      tenantId: 'tenant-a',
      appId: 'agentic-web',
      idempotencyKey: 'same-key',
      execute: async () => ({ ok: false }),
    }),
  ]);

  const [ra, rb] = await Promise.all([a.promise, b.promise]);
  assert.deepEqual(ra, { ok: true });
  assert.deepEqual(rb, { ok: true });
  assert.equal(runs, 1);
});

void test('idempotency is scoped by tenant and app', async () => {
  const manager = new AgentTaskManager({
    concurrency: 1,
    maxQueueDepth: 10,
    scopeLimits: {
      requestsPerMinute: 100,
      maxQueued: 10,
      maxInFlight: 10,
      maxDaily: 1_000,
    },
  });

  let runs = 0;
  const a = await manager.enqueue({
    tenantId: 'tenant-a',
    appId: 'agentic-web',
    idempotencyKey: 'shared-key',
    execute: async () => {
      runs += 1;
      return 'a';
    },
  });
  const b = await manager.enqueue({
    tenantId: 'tenant-b',
    appId: 'agentic-web',
    idempotencyKey: 'shared-key',
    execute: async () => {
      runs += 1;
      return 'b';
    },
  });

  const [ra, rb] = await Promise.all([a.promise, b.promise]);
  assert.equal(ra, 'a');
  assert.equal(rb, 'b');
  assert.equal(runs, 2);
});

void test('idempotency records expire after TTL', async () => {
  let logicalNow = 10_000;
  const manager = new AgentTaskManager({
    concurrency: 1,
    now: () => logicalNow,
    maxQueueDepth: 10,
    idempotencyTtlMs: 20,
    scopeLimits: {
      requestsPerMinute: 100,
      maxQueued: 10,
      maxInFlight: 10,
      maxDaily: 1_000,
    },
  });

  let runs = 0;
  const first = await manager.enqueue({
    tenantId: 'tenant-a',
    appId: 'agentic-web',
    idempotencyKey: 'ttl-key',
    execute: async () => {
      runs += 1;
      return 'ok';
    },
  });
  await first.promise;

  const deduped = await manager.enqueue({
    tenantId: 'tenant-a',
    appId: 'agentic-web',
    idempotencyKey: 'ttl-key',
    execute: async () => {
      runs += 1;
      return 'repeat';
    },
  });
  assert.equal(await deduped.promise, 'ok');
  assert.equal(runs, 1);

  logicalNow += 25;
  const afterExpiry = await manager.enqueue({
    tenantId: 'tenant-a',
    appId: 'agentic-web',
    idempotencyKey: 'ttl-key',
    execute: async () => {
      runs += 1;
      return 'fresh';
    },
  });
  assert.equal(await afterExpiry.promise, 'fresh');
  assert.equal(runs, 2);
});

void test('rate limits and quota enforcement reject excess scope traffic', async () => {
  const manager = new AgentTaskManager({
    concurrency: 1,
    maxQueueDepth: 10,
    scopeLimits: {
      requestsPerMinute: 1,
      maxQueued: 10,
      maxInFlight: 10,
      maxDaily: 10,
    },
  });

  const first = await manager.enqueue({
    tenantId: 'tenant-a',
    appId: 'agentic-web',
    idempotencyKey: 'r1',
    execute: async () => 'ok',
  });
  await first.promise;

  await assert.rejects(
    () =>
      manager.enqueue({
        tenantId: 'tenant-a',
        appId: 'agentic-web',
        idempotencyKey: 'r2',
        execute: async () => 'blocked',
      }),
    (error: unknown) =>
      error instanceof TaskRejectedError &&
      error.code === 'RATE_LIMITED' &&
      typeof error.retryAfterMs === 'number',
  );
});

void test('dead-letter queue captures terminal failures', async () => {
  const manager = new AgentTaskManager({
    concurrency: 1,
    maxQueueDepth: 5,
    random: () => 0,
    retryPolicy: {
      baseDelayMs: 1,
      maxDelayMs: 2,
      jitterRatio: 0,
    },
    scopeLimits: {
      requestsPerMinute: 100,
      maxQueued: 10,
      maxInFlight: 10,
      maxDaily: 100,
    },
  });

  const job = await manager.enqueue({
    tenantId: 'tenant-a',
    appId: 'agentic-web',
    idempotencyKey: 'dlq',
    maxAttempts: 2,
    execute: async () => {
      throw new Error('boom');
    },
  });

  await assert.rejects(() => job.promise, /boom/);
  const dlq = manager.deadLetters();
  assert.equal(dlq.length, 1);
  assert.equal(dlq[0]?.idempotencyKey, 'dlq');
  assert.equal(manager.getHealthSnapshot().failed, 1);
});

void test('ttl cache supports invalidation hooks', async () => {
  let now = 1_000;
  const cache = new TtlCache<string, number>(50, () => now);
  const events: string[] = [];
  cache.onInvalidate((event) => {
    events.push(`${event.reason}:${event.key}`);
  });

  cache.set('k', 1);
  assert.equal(cache.get('k'), 1);
  cache.invalidate('k');
  assert.equal(cache.get('k'), null);

  cache.set('x', 2);
  now += 60;
  assert.equal(cache.get('x'), null);
  assert.deepEqual(events, ['manual:k', 'expired:x']);
});
