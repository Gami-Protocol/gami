'use client';

import { useEffect, useState } from 'react';

import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchWaitlistLiveStats } from '@/lib/supabase-waitlist-live';

const SQL_EDITOR =
  'https://supabase.com/dashboard/project/xetqhdzvbfeiedbmopew/sql/new';

/**
 * Shown on /waitlist when the Supabase project has not applied bootstrap_waitlist.sql yet.
 */
export function WaitlistSetupBanner() {
  const [missing, setMissing] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setChecking(false);
      setMissing(true);
      return;
    }
    void fetchWaitlistLiveStats()
      .then((stats) => {
        setMissing(stats == null);
      })
      .catch(() => setMissing(true))
      .finally(() => setChecking(false));
  }, []);

  if (checking || !missing) return null;

  return (
    <div className="mb-6 border-2 border-amber-400/50 bg-amber-400/10 p-5 neo-border">
      <p className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-amber-200">
        Setup required · waitlist database
      </p>
      <p className="mb-3 text-sm text-amber-100/90">
        Supabase project is connected, but <code className="text-white">public.waitlist</code> is
        missing. Apply the bootstrap SQL once to unlock signups, live counters, and TGE wallet
        export.
      </p>
      <a
        href={SQL_EDITOR}
        target="_blank"
        rel="noreferrer"
        className="inline-block border border-amber-200/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-100 hover:bg-amber-200 hover:text-black"
      >
        Open SQL Editor →
      </a>
      <p className="mt-3 font-mono text-[10px] text-amber-100/70">
        Paste <span className="text-white">supabase/bootstrap_waitlist.sql</span> → Run → refresh
      </p>
    </div>
  );
}
