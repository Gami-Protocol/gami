import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { env } from '@/lib/env';
import {
  fetchKycAdminQueue,
  reviewKycApplication,
  type KycAdminRow,
} from '@/lib/kyc';
import { REFERRAL_REWARD_TIERS } from '@/lib/waitlist';

type AdminStats = {
  total: number;
  today: number;
  sources: Array<{ source: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  leaderboard: Array<{ code: string; referrals: number; reward_tier: string }>;
};

type AdminRow = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: string | null;
  wallet_address: string | null;
  referral_code: string | null;
  referred_by: string | null;
  source: string | null;
  country: string | null;
  status: string | null;
  created_at: string;
};

const SESSION_KEY = 'gami_waitlist_admin_secret';

function adminUrl(): string | null {
  const base = env.supabaseUrl()?.replace(/\/$/, '');
  if (!base) return null;
  return `${base}/functions/v1/waitlist-admin`;
}

export function AdminPage() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? '');
  const [unlocked, setUnlocked] = useState(() => Boolean(sessionStorage.getItem(SESSION_KEY)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [qEmail, setQEmail] = useState('');
  const [qWallet, setQWallet] = useState('');
  const [qCompany, setQCompany] = useState('');
  const [tab, setTab] = useState<'waitlist' | 'kyc'>('waitlist');
  const [kycRows, setKycRows] = useState<KycAdminRow[]>([]);
  const [kycPending, setKycPending] = useState(0);
  const [kycBusyId, setKycBusyId] = useState<string | null>(null);
  const [raiseBusy, setRaiseBusy] = useState(false);
  const [raiseMessage, setRaiseMessage] = useState('');

  const endpoint = useMemo(() => adminUrl(), []);

  function raiseLiveUrl(): string | null {
    const base = env.supabaseUrl()?.replace(/\/$/, '');
    if (!base) return null;
    return `${base}/functions/v1/waitlist-raise-live`;
  }

  const load = useCallback(
    async (adminSecret: string) => {
      if (!endpoint) {
        setError('Set VITE_SUPABASE_URL to enable admin.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (qEmail.trim()) params.set('email', qEmail.trim());
        if (qWallet.trim()) params.set('wallet', qWallet.trim());
        if (qCompany.trim()) params.set('company', qCompany.trim());

        const res = await fetch(`${endpoint}?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${adminSecret}`,
            apikey: env.supabaseAnonKey() ?? '',
          },
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          stats?: AdminStats;
          rows?: AdminRow[];
        };
        if (!res.ok || data.ok === false) {
          setError(data.error || 'Unauthorized or admin function unavailable');
          setUnlocked(false);
          sessionStorage.removeItem(SESSION_KEY);
          return;
        }
        setStats(data.stats ?? null);
        setRows(data.rows ?? []);
        setUnlocked(true);
        sessionStorage.setItem(SESSION_KEY, adminSecret);
      } catch {
        setError('Could not reach waitlist-admin function');
      } finally {
        setLoading(false);
      }
    },
    [endpoint, qCompany, qEmail, qWallet],
  );

  const loadKyc = useCallback(
    async (adminSecret: string) => {
      setLoading(true);
      setError('');
      const result = await fetchKycAdminQueue(adminSecret, { status: 'pending' });
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setKycRows(result.rows);
      setKycPending(result.pending);
    },
    [],
  );

  useEffect(() => {
    if (unlocked && secret) {
      void load(secret);
      void loadKyc(secret);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- unlock once on mount

  function onUnlock(e: FormEvent) {
    e.preventDefault();
    const value = secret.trim();
    void load(value);
    void loadKyc(value);
  }

  async function notifyRaiseLive(dryRun: boolean) {
    const url = raiseLiveUrl();
    if (!url) {
      setRaiseMessage('Set VITE_SUPABASE_URL to enable raise-live alerts.');
      return;
    }
    if (
      !dryRun &&
      !window.confirm(
        'Email every waitlist member that the raise is live? This cannot be undone for recipients who have not been notified yet.',
      )
    ) {
      return;
    }

    setRaiseBusy(true);
    setRaiseMessage('');
    try {
      const anon = env.supabaseAnonKey() ?? '';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anon}`,
          apikey: anon,
          'x-admin-secret': secret,
        },
        body: JSON.stringify({
          confirm: 'raise is live',
          dry_run: dryRun,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        dry_run?: boolean;
        would_send?: number;
        sent?: number;
        failed?: number;
        total?: number;
      };
      if (!res.ok || data.ok === false) {
        setRaiseMessage(data.error || 'Raise-live notify failed');
        return;
      }
      if (data.dry_run) {
        setRaiseMessage(`Dry run: would email ${data.would_send ?? 0} waitlist members.`);
        return;
      }
      setRaiseMessage(
        `Raise-live emails sent: ${data.sent ?? 0}/${data.total ?? 0}` +
          (data.failed ? ` (${data.failed} failed)` : ''),
      );
    } catch {
      setRaiseMessage('Could not reach waitlist-raise-live function');
    } finally {
      setRaiseBusy(false);
    }
  }

  async function decideKyc(id: string, decision: 'approved' | 'rejected') {
    setKycBusyId(id);
    setError('');
    const result = await reviewKycApplication(secret, {
      id,
      decision,
      rejection_reason: decision === 'rejected' ? 'Rejected by admin review' : undefined,
    });
    setKycBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await loadKyc(secret);
  }

  function exportCsv() {
    const header = [
      'email',
      'full_name',
      'company',
      'role',
      'wallet_address',
      'referral_code',
      'referred_by',
      'source',
      'country',
      'status',
      'created_at',
    ];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        header
          .map((h) => {
            const raw = String((r as unknown as Record<string, unknown>)[h] ?? '');
            return `"${raw.replace(/"/g, '""')}"`;
          })
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gami-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-gami-accent">Ops</p>
        <h1 className="mb-8 font-display text-4xl font-bold uppercase italic md:text-5xl">
          Ops admin
        </h1>

        {!unlocked ? (
          <form onSubmit={onUnlock} className="max-w-md space-y-4 border-2 border-white/10 bg-black/40 p-8 neo-border">
            <p className="text-sm text-gray-400">
              Enter the <code className="text-gami-accent">WAITLIST_ADMIN_SECRET</code> (or{' '}
              <code className="text-gami-accent">KYC_ADMIN_SECRET</code>) configured on Supabase edge
              functions.
            </p>
            <input
              type="password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="form-input"
              placeholder="Admin secret"
              autoComplete="current-password"
            />
            {error ? <p className="font-mono text-xs text-red-300">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="gami-gradient w-full py-4 font-display font-bold uppercase tracking-widest neo-border disabled:opacity-60"
            >
              {loading ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            {error ? <p className="font-mono text-xs text-red-300">{error}</p> : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('waitlist')}
                className={`border-2 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest ${
                  tab === 'waitlist' ? 'border-gami-accent text-gami-accent' : 'border-white/20 text-gray-400'
                }`}
              >
                Waitlist
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('kyc');
                  void loadKyc(secret);
                }}
                className={`border-2 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest ${
                  tab === 'kyc' ? 'border-gami-accent text-gami-accent' : 'border-white/20 text-gray-400'
                }`}
              >
                KYC queue ({kycPending})
              </button>
            </div>

            {tab === 'kyc' ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Pending KYC" value={kycPending} />
                </div>
                <div className="overflow-x-auto border-2 border-white/10 neo-border">
                  <table className="min-w-full text-left font-mono text-xs">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                      <tr>
                        <th className="px-3 py-3">Wallet</th>
                        <th className="px-3 py-3">Name</th>
                        <th className="px-3 py-3">Email</th>
                        <th className="px-3 py-3">Country</th>
                        <th className="px-3 py-3">Doc</th>
                        <th className="px-3 py-3">Created</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kycRows.map((row) => (
                        <tr key={row.id} className="border-t border-white/5">
                          <td className="px-3 py-2">{row.wallet_address}</td>
                          <td className="px-3 py-2">{row.full_legal_name}</td>
                          <td className="px-3 py-2">{row.email}</td>
                          <td className="px-3 py-2">
                            {row.residence_country}/{row.nationality}
                          </td>
                          <td className="px-3 py-2">
                            {row.document_type} ·••{row.document_last4}
                          </td>
                          <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={kycBusyId === row.id}
                                onClick={() => void decideKyc(row.id, 'approved')}
                                className="border border-green-500/50 px-2 py-1 text-green-300 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={kycBusyId === row.id}
                                onClick={() => void decideKyc(row.id, 'rejected')}
                                className="border border-red-500/50 px-2 py-1 text-red-300 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!kycRows.length ? (
                    <p className="p-6 text-sm text-gray-500">No pending KYC applications.</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {tab === 'waitlist' ? (
            <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total signups" value={stats?.total ?? 0} />
              <StatCard label="Today" value={stats?.today ?? 0} />
              <StatCard label="Sources" value={stats?.sources?.length ?? 0} />
              <StatCard label="Countries" value={stats?.countries?.length ?? 0} />
            </div>

            <div className="border-2 border-gami-accent/40 bg-black/40 p-6 neo-border">
              <h2 className="mb-2 font-display text-xl font-bold uppercase">Raise is live alert</h2>
              <p className="mb-4 max-w-2xl text-sm text-gray-400">
                Email everyone on the waitlist that the $GAMI raise is open. Requires{' '}
                <code className="text-gami-accent">waitlist-raise-live</code> deployed with Resend +
                admin secret. Skips people already notified unless you force from the API.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={raiseBusy}
                  onClick={() => void notifyRaiseLive(true)}
                  className="border-2 border-white/30 px-5 py-3 font-display text-xs font-bold uppercase tracking-widest hover:border-white disabled:opacity-60"
                >
                  {raiseBusy ? 'Working…' : 'Dry run'}
                </button>
                <button
                  type="button"
                  disabled={raiseBusy}
                  onClick={() => void notifyRaiseLive(false)}
                  className="gami-gradient px-5 py-3 font-display text-xs font-bold uppercase tracking-widest neo-border disabled:opacity-60"
                >
                  {raiseBusy ? 'Sending…' : 'Send raise-live emails'}
                </button>
              </div>
              {raiseMessage ? (
                <p className="mt-4 font-mono text-xs text-gami-accent">{raiseMessage}</p>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="border-2 border-white/10 bg-black/40 p-6 neo-border">
                <h2 className="mb-4 font-display text-xl font-bold uppercase">Referral leaderboard</h2>
                <ul className="space-y-2 font-mono text-sm">
                  {(stats?.leaderboard ?? []).slice(0, 15).map((row) => (
                    <li key={row.code} className="flex justify-between gap-4 border-b border-white/5 py-2">
                      <span className="text-gami-accent">{row.code}</span>
                      <span>
                        {row.referrals} · {row.reward_tier}
                      </span>
                    </li>
                  ))}
                  {!stats?.leaderboard?.length ? (
                    <li className="text-gray-500">No referrals yet</li>
                  ) : null}
                </ul>
                <ul className="mt-4 space-y-1 font-mono text-[10px] text-gray-500">
                  {REFERRAL_REWARD_TIERS.map((t) => (
                    <li key={t.min}>
                      {t.min}+ → {t.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-2 border-white/10 bg-black/40 p-6 neo-border">
                <h2 className="mb-4 font-display text-xl font-bold uppercase">Breakdown</h2>
                <p className="mb-2 font-mono text-[10px] uppercase text-gray-500">Sources</p>
                <ul className="mb-4 space-y-1 font-mono text-sm">
                  {(stats?.sources ?? []).map((s) => (
                    <li key={s.source} className="flex justify-between">
                      <span>{s.source || 'unknown'}</span>
                      <span>{s.count}</span>
                    </li>
                  ))}
                </ul>
                <p className="mb-2 font-mono text-[10px] uppercase text-gray-500">Countries</p>
                <ul className="space-y-1 font-mono text-sm">
                  {(stats?.countries ?? []).slice(0, 12).map((c) => (
                    <li key={c.country} className="flex justify-between">
                      <span>{c.country || 'unknown'}</span>
                      <span>{c.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-2 border-white/10 bg-black/40 p-6 neo-border md:flex-row md:items-end">
              <Field label="Email" value={qEmail} onChange={setQEmail} />
              <Field label="Wallet" value={qWallet} onChange={setQWallet} />
              <Field label="Company" value={qCompany} onChange={setQCompany} />
              <button
                type="button"
                onClick={() => void load(secret)}
                disabled={loading}
                className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black disabled:opacity-60"
              >
                Search
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="gami-gradient px-6 py-3 font-display text-sm font-bold uppercase tracking-widest neo-border"
              >
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto border-2 border-white/10 neo-border">
              <table className="min-w-full text-left font-mono text-xs">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Company</th>
                    <th className="px-3 py-3">Wallet</th>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">{r.full_name}</td>
                      <td className="px-3 py-2">{r.company}</td>
                      <td className="px-3 py-2">{r.wallet_address}</td>
                      <td className="px-3 py-2 text-gami-accent">{r.referral_code}</td>
                      <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length ? (
                <p className="p-6 text-sm text-gray-500">No rows match this search.</p>
              ) : null}
            </div>
            </>
            ) : null}
          </div>
        )}
      </div>
      <GamiFooter />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-white/10 bg-black/40 p-5 neo-border">
      <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1">
      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input"
      />
    </div>
  );
}
