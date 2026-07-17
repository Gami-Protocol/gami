/**
 * ICO quest verification — gates XP awards on real sale actions.
 */

import { fetchSaleEligibility } from '@/lib/sale';

export type IcoQuestId = 'join-presale' | 'verify-kyc' | 'claim-tge';

export async function verifyIcoQuest(
  questId: IcoQuestId,
  walletAddress: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!walletAddress?.startsWith('0x')) {
    return { ok: false, error: 'Connect your wallet first.' };
  }

  const eligibility = await fetchSaleEligibility(walletAddress);

  switch (questId) {
    case 'join-presale': {
      if (eligibility?.on_waitlist || (eligibility?.contributed_usd ?? 0) > 0) {
        return { ok: true };
      }
      return { ok: false, error: 'Join the waitlist or contribute on gami-web first.' };
    }
    case 'verify-kyc': {
      if (eligibility?.kyc_status === 'approved') return { ok: true };
      return { ok: false, error: 'Complete KYC on the sale portal.' };
    }
    case 'claim-tge': {
      const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (base && key) {
        const res = await fetch(
          `${base}/rest/v1/claim_events?wallet_address=eq.${walletAddress.toLowerCase()}&select=id&limit=1`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
          },
        );
        if (res.ok) {
          const rows = (await res.json()) as unknown[];
          if (rows.length > 0) return { ok: true };
        }
      }
      return { ok: false, error: 'Claim your tokens in the Claim screen first.' };
    }
    default:
      return { ok: false, error: 'Unknown quest.' };
  }
}
