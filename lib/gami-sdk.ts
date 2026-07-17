/**
 * Gami wallet SDK — XP from local store, $GAMI from on-chain viem reads.
 *
 * Mirrors the documented surface from the Gami engagement network wallet spec so the real
 * SDK can drop in later without screen changes:
 *
 *   import { createGamiWallet } from '@gami/wallet-sdk';
 *   const wallet = await createGamiWallet();
 *   const stats = await wallet.checkMyLevel();           // { level, totalXP, xpToNextLevel }
 *   const off   = wallet.subscribeToLevelUps((user, newLevel, totalXP) => {});
 *
 * Backed by the persisted onboardingStore so XP changes are reflected here and
 * level-up callbacks fire when XP crosses a threshold. Wallet balances use
 * on-chain reads and fall back to a derived mock when contracts are not configured.
 */

import type { Address } from 'viem';

import { fetchClaimableGami, fetchGamiBalance } from '@/lib/chain';
import { useOnboardingStore } from '@/lib/store';

export interface LevelStats {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  xpThisLevel: number;
  progress: number;
  /** On-chain $GAMI balance (or mock fallback). */
  gamiBalance: number;
  /** Claimable vested $GAMI from ICO. */
  claimableGami: number;
  /** Soulbound Universal Points (== XP). */
  points: number;
  rank: number;
  /** Whether balance is from chain or mock. */
  balanceSource: 'chain' | 'mock';
}

export type LevelUpListener = (user: string, newLevel: number, totalXP: number) => void;

export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return 500 * level + 250 * level * (level - 1);
}

export function levelForXP(totalXP: number): number {
  let level = 0;
  while (xpForLevel(level + 1) <= totalXP) level += 1;
  return level;
}

/** Mock balance used when chain is not configured. */
export function mockGamiBalance(totalXP: number, spentGami = 0): number {
  return Math.max(0, Number((totalXP * 0.002 - spentGami).toFixed(2)));
}

export function statsFromXP(
  totalXP: number,
  spentGami = 0,
  onChainGami?: number | null,
  claimableGami = 0,
): LevelStats {
  const level = levelForXP(totalXP);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor || 1;
  const xpThisLevel = totalXP - floor;
  const useChain = onChainGami !== null && onChainGami !== undefined;
  const gamiBalance = useChain ? onChainGami : mockGamiBalance(totalXP, spentGami);

  return {
    level,
    totalXP,
    xpToNextLevel: Math.max(0, ceil - totalXP),
    xpThisLevel,
    progress: Math.min(1, xpThisLevel / span),
    gamiBalance,
    claimableGami,
    points: totalXP,
    rank: Math.max(1, 18420 - totalXP * 4),
    balanceSource: useChain ? 'chain' : 'mock',
  };
}

export async function fetchStatsForAddress(address: string | null): Promise<LevelStats> {
  const s = useOnboardingStore.getState();
  if (!address?.startsWith('0x')) {
    return statsFromXP(s.xp, s.spentGami);
  }

  const [onChain, claimable] = await Promise.all([
    fetchGamiBalance(address as Address),
    fetchClaimableGami(address as Address),
  ]);

  return statsFromXP(s.xp, s.spentGami, onChain, claimable ?? 0);
}

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

useOnboardingStore.subscribe((state, prev) => {
  if (state.xp === prev.xp) return;
  const newLevel = levelForXP(state.xp);
  if (newLevel > lastNotifiedLevel) {
    lastNotifiedLevel = newLevel;
    const addr = state.walletAddress ?? '0x0';
    for (const cb of listeners) cb(addr, newLevel, state.xp);
  }
});

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
 * off-app engagement supervisor. XP is applied optimistically at queue time and
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

  useOnboardingStore.getState().addXP(xp);

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
  getClaimable(): Promise<number>;
  awardXP(amount: number): Promise<LevelStats>;
}

export async function createGamiWallet(preferredAddress?: string | null): Promise<GamiWallet> {
  await new Promise((r) => setTimeout(r, 350));

  const store = useOnboardingStore.getState();
  let address = preferredAddress ?? store.walletAddress;
  if (!address) {
    address = randomAddress();
  }
  if (address !== store.walletAddress) {
    store.setWalletAddress(address);
  }
  lastNotifiedLevel = levelForXP(useOnboardingStore.getState().xp);

  return {
    address,
    async checkMyLevel() {
      return fetchStatsForAddress(address);
    },
    subscribeToLevelUps(cb: LevelUpListener) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async getBalance(denom) {
      const stats = await fetchStatsForAddress(address);
      return denom === 'gami' ? stats.gamiBalance : stats.points;
    },
    async getClaimable() {
      if (!address?.startsWith('0x')) return 0;
      return (await fetchClaimableGami(address as Address)) ?? 0;
    },
    async awardXP(amount: number) {
      useOnboardingStore.getState().addXP(amount);
      return fetchStatsForAddress(address);
    },
  };
}
