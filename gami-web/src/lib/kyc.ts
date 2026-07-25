import { getFunctionsBase } from '@/lib/contracts';
import { env } from '@/lib/env';

export type KycStatus = 'pending' | 'approved' | 'rejected' | 'review';
export type KycDocumentType = 'passport' | 'national_id' | 'drivers_license';

export type KycSubmitInput = {
  wallet_address: string;
  email: string;
  full_legal_name: string;
  date_of_birth: string;
  nationality: string;
  residence_country: string;
  document_type: KycDocumentType;
  document_number: string;
  ip_country?: string | null;
  wallet_signature: string;
  signed_message: string;
  attested_not_restricted: boolean;
  attested_terms: boolean;
  attested_accuracy: boolean;
};

export type KycSubmitResult =
  | {
      ok: true;
      kyc_status: KycStatus;
      auto_approved: boolean;
      next_step: 'eligibility' | 'review';
      application?: { id: string; status: string };
    }
  | { ok: false; error: string; blocked_country?: string };

export type KycAdminRow = {
  id: string;
  wallet_address: string;
  email: string;
  full_legal_name: string;
  date_of_birth: string;
  nationality: string;
  residence_country: string;
  document_type: string;
  document_last4: string | null;
  ip_country: string | null;
  status: KycStatus;
  provider: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};

export function buildKycSignMessage(wallet: string, email: string): string {
  const issuedAt = new Date().toISOString();
  return [
    'Gami Protocol — Identity Verification',
    '',
    `Wallet: ${wallet.toLowerCase()}`,
    `Email: ${email.trim().toLowerCase()}`,
    `Issued at: ${issuedAt}`,
    '',
    'I confirm this KYC application is accurate, submitted by the wallet owner,',
    'and I agree to the Gami Protocol sale terms and privacy policy.',
  ].join('\n');
}

export function externalKycUrl(wallet: string): string | null {
  const template = env.kycVerificationUrl();
  if (!template) return null;
  return template
    .replace(/\{wallet\}/g, encodeURIComponent(wallet))
    .replace(/\{address\}/g, encodeURIComponent(wallet));
}

export function kycProviderLabel(): string {
  return (env.kycProvider() ?? 'builtin').toLowerCase();
}

export async function submitKycApplication(input: KycSubmitInput): Promise<KycSubmitResult> {
  const base = getFunctionsBase();
  if (!base) {
    return {
      ok: false,
      error: 'KYC backend not configured. Set VITE_SUPABASE_URL / VITE_SUPABASE_FUNCTIONS_URL.',
    };
  }

  try {
    const res = await fetch(`${base}/kyc-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.supabaseAnonKey() ?? '',
        Authorization: `Bearer ${env.supabaseAnonKey() ?? ''}`,
      },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      blocked_country?: string;
      kyc_status?: KycStatus;
      auto_approved?: boolean;
      next_step?: 'eligibility' | 'review';
      application?: { id: string; status: string };
    };

    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        error: data.error || 'KYC submission failed',
        blocked_country: data.blocked_country,
      };
    }

    return {
      ok: true,
      kyc_status: data.kyc_status ?? 'pending',
      auto_approved: Boolean(data.auto_approved),
      next_step: data.next_step ?? 'review',
      application: data.application,
    };
  } catch {
    return { ok: false, error: 'Network error submitting KYC application' };
  }
}

export async function fetchKycAdminQueue(
  adminSecret: string,
  opts?: { status?: string; wallet?: string },
): Promise<{ ok: true; pending: number; rows: KycAdminRow[] } | { ok: false; error: string }> {
  const base = getFunctionsBase();
  if (!base) return { ok: false, error: 'Functions URL not configured' };

  const params = new URLSearchParams();
  params.set('status', opts?.status ?? 'pending');
  if (opts?.wallet) params.set('wallet', opts.wallet);

  try {
    const res = await fetch(`${base}/kyc-review?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${adminSecret}`,
        apikey: env.supabaseAnonKey() ?? '',
      },
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      pending?: number;
      rows?: KycAdminRow[];
    };
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.error || 'Unauthorized' };
    }
    return { ok: true, pending: data.pending ?? 0, rows: data.rows ?? [] };
  } catch {
    return { ok: false, error: 'Network error loading KYC queue' };
  }
}

export async function reviewKycApplication(
  adminSecret: string,
  input: { id?: string; wallet_address?: string; decision: 'approved' | 'rejected'; rejection_reason?: string },
): Promise<{ ok: true; kyc_status: string } | { ok: false; error: string }> {
  const base = getFunctionsBase();
  if (!base) return { ok: false, error: 'Functions URL not configured' };

  try {
    const res = await fetch(`${base}/kyc-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSecret}`,
        apikey: env.supabaseAnonKey() ?? '',
      },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      kyc_status?: string;
    };
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.error || 'Review failed' };
    }
    return { ok: true, kyc_status: data.kyc_status ?? input.decision };
  } catch {
    return { ok: false, error: 'Network error reviewing KYC' };
  }
}
