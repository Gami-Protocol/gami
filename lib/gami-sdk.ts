/**
 * Gami wallet SDK.
 *
 * Mirrors the documented surface from the Gami Protocol build spec:
 *
 *   import { createGamiWallet } from '@gami/wallet-sdk';
 *   const wallet = await createGamiWallet();
 *   const stats = await wallet.checkMyLevel();           // { level, totalXP, xpToNextLevel }
 *   const off   = wallet.subscribeToLevelUps((user, newLevel, totalXP) => {});
 *
 * When EXPO_PUBLIC_GAMI_RPC_URL is set the wallet reads real XP, level and
 * budget data from the Gami Protocol chain via the IGamiXP and IGamiTreasury
 * precompiles (see lib/chain-client.ts). Without an RPC URL it falls back to
 * the persisted onboardingStore so the UI keeps working in dev / Expo Go.
 */

import type { Address } from 'viem';

import {
  checkAgentBudget as chainCheckAgentBudget,
  getOnChainXP,
  type AgentBudget,
  watchLevelUpEvents,
} from '@/lib/chain-client';
import { useOnboardingStore } from '@/lib/store';

export interface LevelStats {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  /** Convenience: XP required for the current level's progress bar. */
  xpThisLevel: number;
  /** 0..1 progress to next level. */
  progress: number;
  /** Mock native $GAMI balance. */
  gamiBalance: number;
  /** Soulbound Universal Points (== XP). */
  points: number;
  /** Leaderboard rank. */
  rank: number;
}

export type LevelUpListener = (user: string, newLevel: number, totalXP: number) => void;

/** XP needed to reach `level` (cumulative). Simple quadratic curve. */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return 500 * level + 250 * level * (level - 1);
}

export function levelForXP(totalXP: number): number {
  let level = 0;
  while (xpForLevel(level + 1) <= totalXP) level += 1;
  return level;
}

export function statsFromXP(totalXP: number, spentGami = 0): LevelStats {
  const level = levelForXP(totalXP);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor || 1;
  const xpThisLevel = totalXP - floor;
  const gamiBalance = Math.max(0, Number((totalXP * 0.002 - spentGami).toFixed(2)));
  return {
    level,
    totalXP,
    xpToNextLevel: Math.max(0, ceil - totalXP),
    xpThisLevel,
    progress: Math.min(1, xpThisLevel / span),
    gamiBalance,
    points: totalXP,
    rank: Math.max(1, 18420 - totalXP * 4),
  };
}

/** Pull current stats straight from the store (XP + spend). */
export function currentStats(): LevelStats {
  const s = useOnboardingStore.getState();
  return statsFromXP(s.xp, s.spentGami);
}

function randomAddress(): string {
  const hex = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < 40; i += 1) out += hex[Math.floor(Math.random() * 16)];
  return out;
}

const listeners = new Set<LevelUpListener>();
let lastNotifiedLevel = levelForXP(useOnboardingStore.getState().xp);

// Bridge store XP changes into level-up callbacks.
useOnboardingStore.subscribe((state, prev) => {
  if (state.xp === prev.xp) return;
  const newLevel = levelForXP(state.xp);
  if (newLevel > lastNotifiedLevel) {
    lastNotifiedLevel = newLevel;
    const addr = state.walletAddress ?? '0x0';
    for (const cb of listeners) cb(addr, newLevel, state.xp);
  }
});

/**
 * Outbox envelope for any state-changing action (guardrail #5).
 *
 * The client NEVER mutates chain state synchronously. A write intent returns a
 * `queued` envelope; an off-app supervisor (`gami-agent`) performs the real
 * write and the status advances QUEUED -> SETTLING -> SETTLED. XP shown before
 * settlement is purely optimistic and the edge/chain stays the source of truth.
 */
export type EnvelopeStatus = 'queued' | 'settling' | 'settled' | 'failed';

export interface ChainActionEnvelope {
  envelopeId: string;
  status: EnvelopeStatus;
  action: { type: 'quest_complete'; questId: string; xp: number };
}

export type EnvelopeListener = (envelope: ChainActionEnvelope) => void;

function envelopeId(): string {
  return `env_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Submit a quest-completion write intent. Returns a `queued` envelope
 * immediately (the write is NOT applied here), then advances the envelope to
 * `settling` and finally `settled` via the `onUpdate` callback to mimic the
 * off-app gami-agent supervisor. XP is applied optimistically at queue time and
 * never re-applied on settle.
 */
export function questComplete(
  questId: string,
  xp: number,
  onUpdate: EnvelopeListener,
): ChainActionEnvelope {
  const envelope: ChainActionEnvelope = {
    envelopeId: envelopeId(),
    status: 'queued',
    action: { type: 'quest_complete', questId, xp },
  };

  // Optimistic local XP bump (source of truth remains the edge/chain).
  useOnboardingStore.getState().addXP(xp);

  // Supervisor advances the envelope off the UI thread:
  // queued (returned now) -> settling -> settled.
  setTimeout(() => onUpdate({ ...envelope, status: 'queued' }), 700);
  setTimeout(() => onUpdate({ ...envelope, status: 'settling' }), 1500);
  setTimeout(() => onUpdate({ ...envelope, status: 'settled' }), 2900);

  return envelope;
}

export interface GamiWallet {
  address: string;
  checkMyLevel(): Promise<LevelStats>;
  subscribeToLevelUps(cb: LevelUpListener): () => void;
  getBalance(denom: 'gami' | 'points'): Promise<number>;
  /** Award XP through the (mock) reward path. */
  awardXP(amount: number): Promise<LevelStats>;
  /**
   * Check whether an AI agent address has remaining Treasury budget.
   * When no chain RPC URL is configured returns a mock "always allowed" result.
   */
  checkAgentBudget(agentAddress: string, amount: bigint): Promise<AgentBudget>;
}

/** Create (or recover) the on-device Gami wallet. */
export async function createGamiWallet(preferredAddress?: string | null): Promise<GamiWallet> {
  // Simulate on-device keygen latency.
  await new Promise((r) => setTimeout(r, 350));

  const store = useOnboardingStore.getState();
  let address = preferredAddress ?? store.walletAddress;
  if (!address) {
    address = randomAddress();
  }
  // Persist whichever address we settled on (Privy embedded or mock).
  if (address !== store.walletAddress) {
    store.setWalletAddress(address);
  }
  lastNotifiedLevel = levelForXP(useOnboardingStore.getState().xp);

  // Attempt to sync XP from the chain when an RPC URL is configured.
  const rpcUrl = process.env.EXPO_PUBLIC_GAMI_RPC_URL ?? '';
  if (rpcUrl) {
    const onChainXP = await getOnChainXP(address as Address, rpcUrl);
    if (onChainXP !== null) {
      const xpNum = Number(onChainXP);
      // Only advance local XP — never roll it back — to keep optimistic updates.
      if (xpNum > useOnboardingStore.getState().xp) {
        useOnboardingStore.getState().addXP(xpNum - useOnboardingStore.getState().xp);
      }
    }
  }

  return {
    address,
    async checkMyLevel() {
      // When the chain is reachable, re-read XP so stats stay in sync.
      if (rpcUrl) {
        const onChainXP = await getOnChainXP(address as Address, rpcUrl);
        if (onChainXP !== null) {
          const xpNum = Number(onChainXP);
          if (xpNum > useOnboardingStore.getState().xp) {
            useOnboardingStore.getState().addXP(xpNum - useOnboardingStore.getState().xp);
          }
        }
      }
      return currentStats();
    },
    subscribeToLevelUps(cb: LevelUpListener) {
      listeners.add(cb);
      // Also subscribe to real on-chain LevelUp events when RPC is available.
      let unwatchChain = () => {};
      if (rpcUrl) {
        unwatchChain = watchLevelUpEvents(
          address as Address,
          rpcUrl,
          (newLevel, totalXP) => {
            const xpNum = Number(totalXP);
            if (xpNum > useOnboardingStore.getState().xp) {
              useOnboardingStore.getState().addXP(xpNum - useOnboardingStore.getState().xp);
            }
            cb(address, Number(newLevel), xpNum);
          },
        );
      }
      return () => {
        listeners.delete(cb);
        unwatchChain();
      };
    },
    async getBalance(denom) {
      const stats = currentStats();
      return denom === 'gami' ? stats.gamiBalance : stats.points;
    },
    async awardXP(amount: number) {
      useOnboardingStore.getState().addXP(amount);
      return currentStats();
    },
    async checkAgentBudget(agentAddress: string, amount: bigint) {
      if (rpcUrl) {
        const result = await chainCheckAgentBudget(agentAddress as Address, amount, rpcUrl);
        if (result) return result;
      }
      // Mock fallback: always allowed with a generous remaining budget.
      return { allowed: true, remaining: BigInt(1_000_000_000) };
    },
  };
}
