import { env } from '@/lib/env';

/** Public raise participation bounds (GBP). */
export const MIN_CONTRIBUTION_GBP = 100;
export const MAX_CONTRIBUTION_GBP = 10_000;

/** Fallback GBP→USD rate when env is unset (illustrative for USDC settlement). */
const DEFAULT_GBP_USD = 1.27;

export function gbpUsdRate(): number {
  const raw = env.gbpUsdRate();
  if (raw && Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_GBP_USD;
}

/** Convert GBP to USDC amount (6-decimal stable, rounded to cents). */
export function gbpToUsdc(gbp: number, rate = gbpUsdRate()): number {
  if (!Number.isFinite(gbp) || gbp <= 0) return 0;
  return Math.round(gbp * rate * 100) / 100;
}

export function usdcToGbp(usdc: number, rate = gbpUsdRate()): number {
  if (!Number.isFinite(usdc) || usdc <= 0 || rate <= 0) return 0;
  return Math.round((usdc / rate) * 100) / 100;
}

export function minContributionUsdc(): number {
  return gbpToUsdc(MIN_CONTRIBUTION_GBP);
}

export function maxContributionUsdc(): number {
  return gbpToUsdc(MAX_CONTRIBUTION_GBP);
}

export function formatGbp(amount: number): string {
  return `£${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatUsdc(amount: number): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`;
}

/** Clamp a USDC contribution into the public GBP-derived band. */
export function clampUsdcContribution(usdc: number): number {
  return Math.min(maxContributionUsdc(), Math.max(minContributionUsdc(), usdc));
}
