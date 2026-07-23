import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export type WaitlistLiveStats = {
  count: number;
  walletCount: number;
  updatedAt: Date | null;
};

type Unsubscribe = () => void;

function parseStats(raw: unknown): WaitlistLiveStats {
  const data = (raw ?? {}) as {
    count?: number;
    wallet_count?: number;
    updated_at?: string | null;
  };
  return {
    count: Number(data.count ?? 0),
    walletCount: Number(data.wallet_count ?? 0),
    updatedAt: data.updated_at ? new Date(data.updated_at) : null,
  };
}

/** One-shot public stats via RPC (works even before Realtime is enabled). */
export async function fetchWaitlistLiveStats(): Promise<WaitlistLiveStats | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('waitlist_public_stats');
  if (!error && data) return parseStats(data);

  const { data: countOnly, error: countError } = await supabase.rpc('waitlist_public_count');
  if (countError) return null;
  return {
    count: typeof countOnly === 'number' ? countOnly : Number(countOnly ?? 0),
    walletCount: 0,
    updatedAt: null,
  };
}

/**
 * Live waitlist counter.
 * Prefers Realtime on waitlist_stats; falls back to polling the public RPC.
 */
export function subscribeSupabaseWaitlistCount(
  onChange: (stats: WaitlistLiveStats) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const supabase = getSupabase();
  if (!supabase) {
    onChange({ count: 0, walletCount: 0, updatedAt: null });
    return () => undefined;
  }

  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let pollTimer: number | undefined;

  const pull = async () => {
    const stats = await fetchWaitlistLiveStats();
    if (cancelled) return;
    if (stats) {
      onChange(stats);
      return;
    }
    onError?.(
      new Error(
        'Waitlist schema is not applied (missing public.waitlist / waitlist_public_stats).',
      ),
    );
  };

  void pull();

  try {
    channel = supabase
      .channel('waitlist-stats-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist_stats',
          filter: 'id=eq.waitlist',
        },
        (payload) => {
          const next = parseStats(payload.new);
          onChange(next);
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError?.(new Error(`Realtime ${status}`));
        }
      });
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Realtime subscribe failed'));
  }

  // Poll as a safety net (Realtime may be disabled until publication is added).
  pollTimer = window.setInterval(() => {
    void pull();
  }, 12_000);

  return () => {
    cancelled = true;
    if (pollTimer) window.clearInterval(pollTimer);
    if (channel) void supabase.removeChannel(channel);
  };
}

export async function subscribeSupabaseEmailAlert(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase is not configured' };

  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@') || normalized.includes('/')) {
    return { ok: false, error: 'Valid email required' };
  }

  const { error } = await supabase.rpc('waitlist_alert_set', {
    p_email: normalized,
    p_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function unsubscribeSupabaseEmailAlert(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase is not configured' };

  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@') || normalized.includes('/')) {
    return { ok: false, error: 'Valid email required' };
  }

  const { error } = await supabase.rpc('waitlist_alert_set', {
    p_email: normalized,
    p_active: false,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function isWaitlistBackendReady(): boolean {
  return isSupabaseConfigured();
}
