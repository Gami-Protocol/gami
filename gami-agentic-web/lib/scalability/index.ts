import {
  AgentTaskManager,
  type AgentTaskManagerOptions,
  type QueueHealthSnapshot,
  TaskRejectedError,
  TtlCache,
  type TaskPriority,
} from '@/lib/scalability/agent-task-manager';

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_OPTIONS: AgentTaskManagerOptions = {
  concurrency: numberFromEnv(process.env.GAMI_AGENT_WORKER_CONCURRENCY, 4),
  maxQueueDepth: numberFromEnv(process.env.GAMI_AGENT_MAX_QUEUE_DEPTH, 200),
  scopeLimits: {
    requestsPerMinute: numberFromEnv(process.env.GAMI_AGENT_MAX_RPM, 60),
    maxQueued: numberFromEnv(process.env.GAMI_AGENT_MAX_QUEUED_PER_SCOPE, 40),
    maxInFlight: numberFromEnv(process.env.GAMI_AGENT_MAX_INFLIGHT_PER_SCOPE, 6),
    maxDaily: numberFromEnv(process.env.GAMI_AGENT_MAX_DAILY_PER_SCOPE, 2500),
  },
};

export interface AgentTaskRequest {
  tenantId: string;
  appId: string;
  idempotencyKey: string;
  priority?: TaskPriority;
}

let sharedManager: AgentTaskManager | null = null;

export function getAgentTaskManager(): AgentTaskManager {
  if (!sharedManager) {
    sharedManager = new AgentTaskManager(DEFAULT_OPTIONS);
  }
  return sharedManager;
}

export function queueHealthSnapshot(): QueueHealthSnapshot {
  return getAgentTaskManager().getHealthSnapshot();
}

export function buildIdempotencyKey(input: {
  sessionId: string;
  message: string;
  idempotencyKey?: string;
}): string {
  if (input.idempotencyKey?.trim()) {
    return input.idempotencyKey.trim();
  }

  const raw = `${input.sessionId}:${input.message.trim().toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `auto-${Math.abs(hash).toString(36)}`;
}

export { AgentTaskManager, TaskRejectedError, TtlCache };
