import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

/** Base URL for invoking Edge Functions. */
export const FUNCTIONS_URL = supabaseUrl ? `${supabaseUrl}/functions/v1` : '';

export const SUPABASE_ANON_KEY = supabaseAnonKey;
