import { levelForXP } from '@/lib/quest-math';
import type { LedgerEntry, SessionState } from '@/lib/types/agentic-quest';

const DEV_PARTNER_KEY = 'dev-partner-key-gami-5144';

const sessions = new Map<string, SessionState>();
const rateBuckets = new Map<string, number[]>();

const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_MS = 60_000;
const SPAM_COOLDOWN_MS = 800;

export function getPartnerKeys(): Set<string> {
  const envKey = process.env.GAMI_PARTNER_KEY;
  const keys = new Set([DEV_PARTNER_KEY]);
  if (envKey) keys.add(envKey);
  return keys;
}

export function isValidPartnerKey(key: string | null): boolean {
  if (!key) return false;
  return getPartnerKeys().has(key);
}

export function getSession(sessionId: string): SessionState {
  const existing = sessions.get(sessionId);
  if (existing) return existing;

  const fresh: SessionState = {
    sessionId,
    totalXp: 0,
    level: 0,
    questProfiles: [],
    unlockedBadgeIds: ['starter'],
    ledger: [],
  };
  sessions.set(sessionId, fresh);
  return fresh;
}

export function upsertSession(session: SessionState): void {
  sessions.set(session.sessionId, session);
}

export function appendLedger(sessionId: string, entry: Omit<LedgerEntry, 'id' | 'ts'>): LedgerEntry {
  const session = getSession(sessionId);
  const full: LedgerEntry = {
    ...entry,
    id: `led_${crypto.randomUUID().slice(0, 8)}`,
    ts: new Date().toISOString(),
  };
  session.ledger = [...session.ledger, full];
  upsertSession(session);
  return full;
}

export function checkRateLimit(sessionId: string): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(sessionId) ?? [];
  const recent = bucket.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - oldest) };
  }

  recent.push(now);
  rateBuckets.set(sessionId, recent);
  return { ok: true };
}

export function checkSpam(sessionId: string, message: string): { ok: true } | { ok: false; reason: string } {
  const session = getSession(sessionId);
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return { ok: false, reason: 'Empty message' };
  }

  if (session.lastMessage === normalized && session.lastMessageAt && Date.now() - session.lastMessageAt < SPAM_COOLDOWN_MS) {
    return { ok: false, reason: 'Duplicate message too fast' };
  }

  session.lastMessage = normalized;
  session.lastMessageAt = Date.now();
  upsertSession(session);
  return { ok: true };
}

export function syncLevel(session: SessionState): SessionState {
  const level = levelForXP(session.totalXp);
  return { ...session, level };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
