import { getSupabaseAdmin } from '@/lib/supabase';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
export const HANDLE_RE = /^[a-z0-9_]{3,15}$/;

/** `Foo.gami` / `@foo` / `FOO` all normalize to `foo`. */
export function normalizeHandle(raw: string | null | undefined): string {
  return (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.gami$/i, '')
    .replace(/^@/, '');
}

export function toGamiDnsName(handle: string): string {
  return `${normalizeHandle(handle)}.gami`;
}

export type ResolveRow = {
  name: string;
  handle: string;
  address: string | null;
  solana_address: string | null;
  status: string;
};

/** CORS so the wallet app and sale site can call these routes directly. */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
} as const;

export function supabaseOrNull() {
  return getSupabaseAdmin();
}
