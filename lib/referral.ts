/**
 * Referral deep link handling for gami://ref/{code} and https://gami.xyz/wallet?ref={code}
 */

import * as Linking from 'expo-linking';

import { hasBackend, supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/lib/store';

const REFERRAL_PREFIX = 'ref/';

/** Parse referral code from a deep link URL. */
export function parseReferralFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    // gami://ref/CODE
    if (parsed.path?.startsWith(REFERRAL_PREFIX)) {
      return normaliseReferralCode(parsed.path.slice(REFERRAL_PREFIX.length));
    }
    // https://...?ref=CODE
    const ref = parsed.queryParams?.ref;
    if (typeof ref === 'string') return normaliseReferralCode(ref);
    if (Array.isArray(ref) && ref[0]) return normaliseReferralCode(ref[0]);
    return null;
  } catch {
    return null;
  }
}

export function normaliseReferralCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
}

/** Generate a referral code from handle or wallet address. */
export function generateReferralCode(handle: string, walletAddress?: string | null): string {
  const base = handle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
  if (base.length >= 4) return `GAMI-${base}`;
  const suffix = walletAddress ? walletAddress.slice(2, 6).toUpperCase() : 'LEGEND';
  return `GAMI-${suffix}`;
}

export function referralDeepLink(code: string): string {
  return Linking.createURL(`ref/${normaliseReferralCode(code)}`);
}

export function referralWebLink(code: string): string {
  const base = process.env.EXPO_PUBLIC_ICO_WEB_URL ?? 'https://gami.xyz/wallet';
  return `${base}?ref=${encodeURIComponent(normaliseReferralCode(code))}`;
}

/** Validate referral via edge function and apply XP bonus. */
export async function applyReferralCode(
  code: string,
  walletAddress?: string | null,
  handle?: string,
): Promise<{ valid: boolean; xpBonus: number }> {
  const normalised = normaliseReferralCode(code);
  const store = useOnboardingStore.getState();

  if (!normalised || store.referralApplied) {
    return { valid: false, xpBonus: 0 };
  }

  store.setReferralCode(normalised);

  if (!hasBackend) {
    store.applyReferralBonus(50);
    return { valid: true, xpBonus: 50 };
  }

  try {
    const { data, error } = await supabase.functions.invoke('referral-validate', {
      body: { code: normalised, wallet_address: walletAddress, handle },
    });
    if (error) throw error;
    if (data?.valid) {
      const bonus = data.invitee_xp_bonus ?? 50;
      store.applyReferralBonus(bonus);
      return { valid: true, xpBonus: bonus };
    }
  } catch {
    // Offline fallback — still apply local bonus
    store.applyReferralBonus(50);
    return { valid: true, xpBonus: 50 };
  }

  return { valid: false, xpBonus: 0 };
}

/** Listen for incoming deep links and extract referral codes. */
export function subscribeReferralLinks(onCode: (code: string) => void): () => void {
  const handle = ({ url }: { url: string }) => {
    const code = parseReferralFromUrl(url);
    if (code) onCode(code);
  };

  const sub = Linking.addEventListener('url', handle);

  void Linking.getInitialURL().then((url) => {
    if (url) {
      const code = parseReferralFromUrl(url);
      if (code) onCode(code);
    }
  });

  return () => sub.remove();
}
