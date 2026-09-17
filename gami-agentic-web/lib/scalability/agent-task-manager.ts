export type TaskPriority = 'high' | 'normal' | 'low';

export interface ManagedTaskContext {
  attempt: number;
  taskId: string;
  idempotencyKey: string;
}

export interface ManagedTaskOptions<TResult> {
  tenantId: string;
  appId: string;
  idempotencyKey: string;
  priority?: TaskPriority;
  maxAttempts?: number;
  execute: (context: ManagedTaskContext) => Promise<TResult>;
}

export interface RetryPolicy {
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
}

export interface ScopeLimits {
  requestsPerMinute: number;
  maxQueued: number;
  maxInFlight: number;
  maxDaily: number;
}

export interface AgentTaskManagerOptions {
  concurrency: number;
  maxQueueDepth: number;
  retryPolicy?: RetryPolicy;
  scopeLimits?: ScopeLimits;
  now?: () => number;
  random?: () => number;
  schedule?: (delayMs: number, callback: () => void) => void;
  metrics?: ScalabilityMetrics;
}

export interface ScalabilityMetrics {
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  increment(name: string, value?: number, labels?: Record<string, string>): void;
  timing(name: string, milliseconds: number, labels?: Record<string, string>): void;
}

export interface TaskHandle<TResult> {
  taskId: string;
  deduped: boolean;
  promise: Promise<TResult>;
}

export interface QueueHealthSnapshot {
  queueDepth: number;
  inFlight: number;
  deadLetterDepth: number;
  completed: number;
  failed: number;
  retried: number;
}

export interface DeadLetterRecord {
  taskId: string;
  idempotencyKey: string;
  tenantId: string;
  appId: string;
  attempts: number;
  lastError: string;
  failedAt: number;
}

interface QueueTask<TResult> {
  taskId: string;
  tenantId: string;
  appId: string;
  idempotencyKey: string;
  priority: TaskPriority;
  attempt: number;
  maxAttempts: number;
  execute: (context: ManagedTaskContext) => Promise<TResult>;
  runAt: number;
}

interface QueueBackend<TResult> {
  enqueue(task: QueueTask<TResult>): boolean;
  dequeueReady(now: number): QueueTask<TResult> | null;
  markComplete(taskId: string): void;
  requeue(task: QueueTask<TResult>): void;
  markDeadLetter(record: DeadLetterRecord): void;
  queueDepth(): number;
  inFlightCount(): number;
  deadLetters(): readonly DeadLetterRecord[];
}

interface PendingTask<TResult> {
  taskId: string;
  promise: Promise<TResult>;
  resolve: (value: TResult) => void;
  reject: (error: Error) => void;
}

interface IdempotencyRecord {
  status: 'pending' | 'settled' | 'failed';
  taskId: string;
  value?: unknown;
  error?: string;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 2,
  normal: 1,
  low: 0,
};

function normalizeScopeKey(tenantId: string, appId: string): string {
  return `${tenantId.trim().toLowerCase()}::${appId.trim().toLowerCase()}`;
}

function normalizeIdempotencyKey(value: string): string {
  return value.trim().toLowerCase();
}

function scopedIdempotencyKey(scopeKey: string, idempotencyKey: string): string {
  return `${scopeKey}::${idempotencyKey}`;
}

function deferred<TResult>(): PendingTask<TResult> {
  let resolve!: (value: TResult) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<TResult>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    taskId: '',
    promise,
    resolve,
    reject,
  };
}

class InMemoryQueueBackend<TResult> implements QueueBackend<TResult> {
  private readonly queued: QueueTask<TResult>[] = [];
  private readonly inFlight = new Map<string, QueueTask<TResult>>();
  private readonly dlq: DeadLetterRecord[] = [];

  enqueue(task: QueueTask<TResult>): boolean {
    this.queued.push(task);
    return true;
  }

  dequeueReady(now: number): QueueTask<TResult> | null {
    let candidateIndex = -1;
    for (let i = 0; i < this.queued.length; i += 1) {
      const current = this.queued[i];
      if (current.runAt > now) continue;

      if (candidateIndex === -1) {
        candidateIndex = i;
        continue;
      }

      const candidate = this.queued[candidateIndex];
      if (PRIORITY_WEIGHT[current.priority] > PRIORITY_WEIGHT[candidate.priority]) {
        candidateIndex = i;
        continue;
      }
      if (
        PRIORITY_WEIGHT[current.priority] === PRIORITY_WEIGHT[candidate.priority] &&
        current.runAt < candidate.runAt
      ) {
        candidateIndex = i;
      }
    }

    if (candidateIndex === -1) return null;

    const [task] = this.queued.splice(candidateIndex, 1);
    this.inFlight.set(task.taskId, task);
    return task;
  }

  markComplete(taskId: string): void {
    this.inFlight.delete(taskId);
  }

  requeue(task: QueueTask<TResult>): void {
    this.inFlight.delete(task.taskId);
    this.queued.push(task);
  }

  markDeadLetter(record: DeadLetterRecord): void {
    this.inFlight.delete(record.taskId);
    this.dlq.push(record);
  }

  queueDepth(): number {
    return this.queued.length;
  }

  inFlightCount(): number {
    return this.inFlight.size;
  }

  deadLetters(): readonly DeadLetterRecord[] {
    return this.dlq;
  }
}

class InMemoryScopeLimiter {
  private readonly windows = new Map<string, number[]>();
  private readonly daily = new Map<string, { dayKey: string; count: number }>();
  private readonly active = new Map<string, { queued: number; inFlight: number }>();

  constructor(
    private readonly limits: ScopeLimits,
    private readonly now: () => number,
  ) {}

  allow(
    scopeKey: string,
  ): { ok: true } | { ok: false; code: 'RATE_LIMITED' | 'QUOTA_EXCEEDED'; retryAfterMs?: number } {
    const now = this.now();
    const bucket = this.windows.get(scopeKey) ?? [];
    const recent = bucket.filter((stamp) => now - stamp < 60_000);
    if (recent.length >= this.limits.requestsPerMinute) {
      const oldest = recent[0] ?? now;
      return { ok: false, code: 'RATE_LIMITED', retryAfterMs: 60_000 - (now - oldest) };
    }

    const dayKey = new Date(now).toISOString().slice(0, 10);
    const daily = this.daily.get(scopeKey);
    const count = daily?.dayKey === dayKey ? daily.count : 0;
    if (count >= this.limits.maxDaily) {
      return { ok: false, code: 'QUOTA_EXCEEDED' };
    }

    const activity = this.active.get(scopeKey) ?? { queued: 0, inFlight: 0 };
    if (activity.queued >= this.limits.maxQueued || activity.inFlight >= this.limits.maxInFlight) {
      return { ok: false, code: 'QUOTA_EXCEEDED' };
    }

    recent.push(now);
    this.windows.set(scopeKey, recent);
    this.daily.set(scopeKey, { dayKey, count: count + 1 });
    return { ok: true };
  }

  markQueued(scopeKey: string): void {
    const activity = this.active.get(scopeKey) ?? { queued: 0, inFlight: 0 };
    activity.queued += 1;
    this.active.set(scopeKey, activity);
  }

  moveQueuedToInFlight(scopeKey: string): void {
    const activity = this.active.get(scopeKey) ?? { queued: 0, inFlight: 0 };
    activity.queued = Math.max(0, activity.queued - 1);
    activity.inFlight += 1;
    this.active.set(scopeKey, activity);
  }

  settleInFlight(scopeKey: string): void {
    const activity = this.active.get(scopeKey) ?? { queued: 0, inFlight: 0 };
    activity.inFlight = Math.max(0, activity.inFlight - 1);
    this.active.set(scopeKey, activity);
  }

  restoreToQueue(scopeKey: string): void {
    const activity = this.active.get(scopeKey) ?? { queued: 0, inFlight: 0 };
    activity.inFlight = Math.max(0, activity.inFlight - 1);
    activity.queued += 1;
    this.active.set(scopeKey, activity);
  }
}

export class TaskRejectedError extends Error {
  constructor(
    readonly code: 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'BACKPRESSURE',
    readonly retryAfterMs?: number,
  ) {
    super(code);
    this.name = 'TaskRejectedError';
  }
}

export class AgentTaskManager {
  private readonly backend: QueueBackend<unknown>;
  private readonly limiter: InMemoryScopeLimiter;
  private readonly retry: RetryPolicy;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly schedule: (delayMs: number, callback: () => void) => void;
  private readonly metrics: ScalabilityMetrics | null;
  private readonly pendingByTaskId = new Map<string, PendingTask<unknown>>();
  private readonly pendingByIdempotency = new Map<string, PendingTask<unknown>>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private inFlightWorkers = 0;
  private completed = 0;
  private failed = 0;
  private retried = 0;

  constructor(private readonly options: AgentTaskManagerOptions) {
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
    this.schedule = options.schedule ?? ((delayMs, callback) => void setTimeout(callback, delayMs));
    this.retry = options.retryPolicy ?? {
      baseDelayMs: 150,
      maxDelayMs: 10_000,
      jitterRatio: 0.2,
    };
    this.metrics = options.metrics ?? null;
    this.backend = new InMemoryQueueBackend<unknown>();
    this.limiter = new InMemoryScopeLimiter(
      options.scopeLimits ?? {
        requestsPerMinute: 60,
        maxQueued: 32,
        maxInFlight: Math.max(1, options.concurrency),
        maxDaily: 2_500,
      },
      this.now,
    );
  }

  async enqueue<TResult>(input: ManagedTaskOptions<TResult>): Promise<TaskHandle<TResult>> {
    const priority = input.priority ?? 'normal';
    const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
    const scopeKey = normalizeScopeKey(input.tenantId, input.appId);
    const scopedKey = scopedIdempotencyKey(scopeKey, idempotencyKey);

    const existing = this.idempotency.get(scopedKey);
    if (existing?.status === 'settled') {
      return {
        taskId: existing.taskId,
        deduped: true,
        promise: Promise.resolve(existing.value as TResult),
      };
    }

    const pending = this.pendingByIdempotency.get(scopedKey);
    if (pending) {
      return {
        taskId: pending.taskId,
        deduped: true,
        promise: pending.promise as Promise<TResult>,
      };
    }

    if (this.backend.queueDepth() >= this.options.maxQueueDepth) {
      throw new TaskRejectedError('BACKPRESSURE');
    }

    const gating = this.limiter.allow(scopeKey);
    if (!gating.ok) {
      throw new TaskRejectedError(gating.code, gating.retryAfterMs);
    }

    const ticket = deferred<TResult>();
    const taskId = `agt_${this.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
    ticket.taskId = taskId;

    const task: QueueTask<TResult> = {
      taskId,
      tenantId: input.tenantId,
      appId: input.appId,
      idempotencyKey,
      priority,
      attempt: 1,
      maxAttempts: Math.max(1, input.maxAttempts ?? 3),
      execute: input.execute,
      runAt: this.now(),
    };

    this.idempotency.set(scopedKey, { status: 'pending', taskId });
    this.pendingByTaskId.set(taskId, ticket as PendingTask<unknown>);
    this.pendingByIdempotency.set(scopedKey, ticket as PendingTask<unknown>);
    this.backend.enqueue(task as QueueTask<unknown>);
    this.limiter.markQueued(scopeKey);
    this.observeDepths();
    this.pump();

    return {
      taskId,
      deduped: false,
      promise: ticket.promise,
    };
  }

  getHealthSnapshot(): QueueHealthSnapshot {
    return {
      queueDepth: this.backend.queueDepth(),
      inFlight: this.backend.inFlightCount(),
      deadLetterDepth: this.backend.deadLetters().length,
      completed: this.completed,
      failed: this.failed,
      retried: this.retried,
    };
  }

  deadLetters(): readonly DeadLetterRecord[] {
    return this.backend.deadLetters();
  }

  private observeDepths(): void {
    this.metrics?.gauge('agent.queue.depth', this.backend.queueDepth());
    this.metrics?.gauge('agent.queue.in_flight', this.backend.inFlightCount());
    this.metrics?.gauge('agent.queue.dead_letter_depth', this.backend.deadLetters().length);
  }

  private pump(): void {
    while (this.inFlightWorkers < Math.max(1, this.options.concurrency)) {
      const task = this.backend.dequeueReady(this.now());
      if (!task) return;

      this.inFlightWorkers += 1;
      const scopeKey = normalizeScopeKey(task.tenantId, task.appId);
      this.limiter.moveQueuedToInFlight(scopeKey);
      this.observeDepths();

      void this.executeTask(task)
        .catch(() => undefined)
        .finally(() => {
          this.inFlightWorkers = Math.max(0, this.inFlightWorkers - 1);
          this.pump();
        });
    }
  }

  private computeBackoff(attempt: number): number {
    const base = this.retry.baseDelayMs * 2 ** Math.max(0, attempt - 1);
    const jitter = base * this.retry.jitterRatio * this.random();
    return Math.min(this.retry.maxDelayMs, Math.floor(base + jitter));
  }

  private resolveTask(task: QueueTask<unknown>, value: unknown): void {
    this.backend.markComplete(task.taskId);
    const pending = this.pendingByTaskId.get(task.taskId);
    this.pendingByTaskId.delete(task.taskId);
    const scopeKey = normalizeScopeKey(task.tenantId, task.appId);
    const scopedKey = scopedIdempotencyKey(scopeKey, task.idempotencyKey);
    this.pendingByIdempotency.delete(scopedKey);
    this.idempotency.set(scopedKey, {
      status: 'settled',
      taskId: task.taskId,
      value,
    });

    this.completed += 1;
    this.metrics?.increment('agent.queue.completed', 1, {
      tenantId: task.tenantId,
      appId: task.appId,
    });
    this.observeDepths();
    pending?.resolve(value);
  }

  private rejectTask(task: QueueTask<unknown>, error: Error): void {
    this.backend.markComplete(task.taskId);
    const pending = this.pendingByTaskId.get(task.taskId);
    this.pendingByTaskId.delete(task.taskId);
    const scopeKey = normalizeScopeKey(task.tenantId, task.appId);
    const scopedKey = scopedIdempotencyKey(scopeKey, task.idempotencyKey);
    this.pendingByIdempotency.delete(scopedKey);
    this.idempotency.set(scopedKey, {
      status: 'failed',
      taskId: task.taskId,
      error: error.message,
    });

    this.failed += 1;
    this.metrics?.increment('agent.queue.failed', 1, {
      tenantId: task.tenantId,
      appId: task.appId,
    });
    this.observeDepths();
    pending?.reject(error);
  }

  private async executeTask(task: QueueTask<unknown>): Promise<void> {
    const startedAt = this.now();
    const scopeKey = normalizeScopeKey(task.tenantId, task.appId);

    try {
      const value = await task.execute({
        attempt: task.attempt,
        taskId: task.taskId,
        idempotencyKey: task.idempotencyKey,
      });
      this.limiter.settleInFlight(scopeKey);
      this.metrics?.timing('agent.queue.latency_ms', this.now() - startedAt, {
        tenantId: task.tenantId,
        appId: task.appId,
      });
      this.resolveTask(task, value);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'task failed';
      if (task.attempt < task.maxAttempts) {
        const delay = this.computeBackoff(task.attempt);
        const retryTask: QueueTask<unknown> = {
          ...task,
          attempt: task.attempt + 1,
          runAt: this.now() + delay,
        };

        this.retried += 1;
        this.metrics?.increment('agent.queue.retried', 1, {
          tenantId: task.tenantId,
          appId: task.appId,
        });
        this.limiter.restoreToQueue(scopeKey);
        this.backend.requeue(retryTask);
        this.observeDepths();

        this.schedule(delay, () => {
          this.pump();
        });
        return;
      }

      this.limiter.settleInFlight(scopeKey);
      const deadLetter: DeadLetterRecord = {
        taskId: task.taskId,
        idempotencyKey: task.idempotencyKey,
        tenantId: task.tenantId,
        appId: task.appId,
        attempts: task.attempt,
        lastError: message,
        failedAt: this.now(),
      };
      this.backend.markDeadLetter(deadLetter);
      this.rejectTask(task, new Error(message));
    }
  }
}

export interface CacheInvalidationEvent<K> {
  key: K;
  reason: 'manual' | 'expired' | 'clear';
}

export class TtlCache<K, V> {
  private readonly values = new Map<K, { value: V; expiresAt: number }>();
  private readonly listeners = new Set<(event: CacheInvalidationEvent<K>) => void>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: K): V | null {
    const current = this.values.get(key);
    if (!current) return null;
    if (current.expiresAt <= this.now()) {
      this.values.delete(key);
      this.emit({ key, reason: 'expired' });
      return null;
    }
    return current.value;
  }

  set(key: K, value: V): void {
    this.values.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  async getOrLoad(key: K, loader: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== null) return cached;
    const value = await loader();
    this.set(key, value);
    return value;
  }

  invalidate(key: K): void {
    if (!this.values.delete(key)) return;
    this.emit({ key, reason: 'manual' });
  }

  clear(): void {
    const keys = [...this.values.keys()];
    this.values.clear();
    for (const key of keys) {
      this.emit({ key, reason: 'clear' });
    }
  }

  onInvalidate(listener: (event: CacheInvalidationEvent<K>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: CacheInvalidationEvent<K>): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
