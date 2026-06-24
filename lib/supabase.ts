import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/** Whether a real Supabase backend is configured. */
export const hasBackend = Boolean(supabaseUrl && supabaseAnonKey);

/** Base URL for invoking Edge Functions. */
export const FUNCTIONS_URL = supabaseUrl ? `${supabaseUrl}/functions/v1` : '';

export const SUPABASE_ANON_KEY = supabaseAnonKey;

/** Shape of a `profiles` row (server source of truth for the wallet account). */
export interface ProfileRow {
  id: string;
  handle: string | null;
  wallet_address: string | null;
  xp: number;
  spent_gami: number;
  avatar_id: string;
  nova_tone: string;
  interests: string[];
  onboarded: boolean;
}

/** Fetch the signed-in user's profile row, or null if none / not signed in. */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, handle, wallet_address, xp, spent_gami, avatar_id, nova_tone, interests, onboarded',
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data as ProfileRow | null;
}

/** Upsert (create or merge) the signed-in user's profile row. */
export async function saveProfile(
  userId: string,
  patch: Partial<Omit<ProfileRow, 'id'>>,
): Promise<void> {
  await supabase.from('profiles').upsert({ id: userId, ...patch }, { onConflict: 'id' });
}
