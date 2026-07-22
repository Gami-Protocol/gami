import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

export type WaitlistRow = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: string | null;
  wallet_address: string | null;
  referral_code: string | null;
  referred_by: string | null;
  source: string | null;
  status: string | null;
  country: string | null;
  created_at: string;
};

let client: SupabaseClient | null | undefined;

/** Browser Supabase client. Returns null when env is missing. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = env.supabaseUrl();
  const anonKey = env.supabaseAnonKey();
  if (!url || !anonKey) {
    client = null;
    return client;
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
