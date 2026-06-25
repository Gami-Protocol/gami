import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Resolve config from EXPO_PUBLIC_* (inlined at build time) first, falling back
// to app.config.ts `extra` (embedded in the native binary). The fallback means
// a native build still finds the backend even if env inlining was missed.
const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? extra.supabaseAnonKey ?? '';

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

/**
 * Live reachability check. Returns true only when the backend is both
 * configured AND responding. Catches the case where keys are embedded but
 * the device is offline or the project is unreachable. Times out fast so it
 * never blocks the UI.
 */
export async function pingBackend(timeoutMs = 4000): Promise<boolean> {
  if (!hasBackend) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: supabaseAnonKey },
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

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
