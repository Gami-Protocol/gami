import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AvatarColorId, NovaTone } from '@/lib/config';

export interface OnboardingState {
  /** Furthest onboarding step reached (route map index 1..11). */
  step: number;
  handle: string;
  avatarId: AvatarColorId;
  interests: string[];
  novaTone: NovaTone;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  rewardAlertsEnabled: boolean;
  hideBalances: boolean;
  novaAssistantEnabled: boolean;
  soundEnabled: boolean;
  email: string;
  /** Supabase auth user id, or null when signed out. */
  userId: string | null;
  walletAddress: string | null;
  xp: number;
  /** $GAMI sent out via the Send flow (subtracted from the derived balance). */
  spentGami: number;
  /** True once the user finished onboarding and reached the app. */
  onboarded: boolean;
  /** Has the home reveal confetti already played. */
  homeRevealSeen: boolean;
  /** Has the First Steps quest been claimed. */
  firstQuestClaimed: boolean;

  // actions
  setStep: (step: number) => void;
  advanceStep: (step: number) => void;
  setHandle: (handle: string) => void;
  setAvatar: (avatarId: AvatarColorId) => void;
  toggleInterest: (id: string) => void;
  setNovaTone: (tone: NovaTone) => void;
  setBiometric: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setRewardAlerts: (v: boolean) => void;
  setHideBalances: (v: boolean) => void;
  setNovaAssistant: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setWalletAddress: (addr: string) => void;
  setEmail: (email: string) => void;
  setAuthUser: (userId: string | null, email?: string) => void;
  /** Replace the whole local profile from a server row (login relink). */
  hydrateFromProfile: (p: {
    handle?: string | null;
    walletAddress?: string | null;
    xp?: number;
    spentGami?: number;
    avatarId?: AvatarColorId;
    novaTone?: NovaTone;
    interests?: string[];
    onboarded?: boolean;
  }) => void;
  /** Wipe local profile + session entirely (full sign-out). */
  signOutLocal: () => void;
  addXP: (amount: number) => void;
  spendGami: (amount: number) => void;
  setOnboarded: (v: boolean) => void;
  markHomeRevealSeen: () => void;
  claimFirstQuest: () => void;
  resetSession: () => void;
}

const initial = {
  step: 1,
  handle: '',
  avatarId: 'magenta' as AvatarColorId,
  interests: [] as string[],
  novaTone: 'chill' as NovaTone,
  biometricEnabled: false,
  notificationsEnabled: false,
  rewardAlertsEnabled: true,
  hideBalances: false,
  novaAssistantEnabled: true,
  soundEnabled: true,
  email: 'nox@gami.xyz',
  userId: null as string | null,
  walletAddress: null as string | null,
  xp: 0,
  spentGami: 0,
  onboarded: false,
  homeRevealSeen: false,
  firstQuestClaimed: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,

      setStep: (step) => set({ step }),
      advanceStep: (step) => set((s) => ({ step: Math.max(s.step, step) })),
      setHandle: (handle) => set({ handle }),
      setAvatar: (avatarId) => set({ avatarId }),
      toggleInterest: (id) =>
        set((s) => ({
          interests: s.interests.includes(id)
            ? s.interests.filter((i) => i !== id)
            : [...s.interests, id],
        })),
      setNovaTone: (novaTone) => set({ novaTone }),
      setBiometric: (biometricEnabled) => set({ biometricEnabled }),
      setNotifications: (notificationsEnabled) => set({ notificationsEnabled }),
      setRewardAlerts: (rewardAlertsEnabled) => set({ rewardAlertsEnabled }),
      setHideBalances: (hideBalances) => set({ hideBalances }),
      setNovaAssistant: (novaAssistantEnabled) => set({ novaAssistantEnabled }),
      setSound: (soundEnabled) => set({ soundEnabled }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      setEmail: (email) => set({ email }),
      setAuthUser: (userId, email) => set((s) => ({ userId, email: email ?? s.email })),
      hydrateFromProfile: (p) =>
        set((s) => ({
          handle: p.handle ?? s.handle,
          walletAddress: p.walletAddress ?? s.walletAddress,
          xp: p.xp ?? s.xp,
          spentGami: p.spentGami ?? s.spentGami,
          avatarId: p.avatarId ?? s.avatarId,
          novaTone: p.novaTone ?? s.novaTone,
          interests: p.interests ?? s.interests,
          onboarded: p.onboarded ?? s.onboarded,
        })),
      signOutLocal: () => set({ ...initial }),
      addXP: (amount) => set((s) => ({ xp: s.xp + amount })),
      spendGami: (amount) => set((s) => ({ spentGami: s.spentGami + amount })),
      setOnboarded: (onboarded) => set({ onboarded }),
      markHomeRevealSeen: () => set({ homeRevealSeen: true }),
      claimFirstQuest: () => set({ firstQuestClaimed: true }),
      resetSession: () =>
        // Clears session/profile but NEVER the on-device wallet key (walletAddress kept).
        set((s) => ({
          ...initial,
          walletAddress: s.walletAddress,
          handle: s.handle,
          avatarId: s.avatarId,
        })),
    }),
    {
      name: 'gami-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Display handle with leading @ stripped/normalised. */
export function normaliseHandle(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

/** Two-letter monogram for avatar tiles. */
export function monogram(handle: string): string {
  const clean = handle.replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length === 0) return 'NX';
  return clean.slice(0, 2).toUpperCase();
}

/** Truncate an address middle: 0x7f3a…b29c */
export function truncateAddress(addr: string | null): string {
  if (!addr) return '0x0000…0000';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
