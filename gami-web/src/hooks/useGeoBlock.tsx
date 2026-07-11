'use client';

import { useEffect, useState } from 'react';

const DEFAULT_BLOCKED = ['US', 'CU', 'IR', 'KP', 'SY'];

function getBlockedCountries(): string[] {
  const raw = process.env.NEXT_PUBLIC_BLOCKED_COUNTRIES;
  if (!raw) return DEFAULT_BLOCKED;
  return raw.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
}

export function useGeoBlock() {
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const blockedList = getBlockedCountries();

    fetch('https://ipapi.co/json/', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        if (!mounted) return;
        const code = (data.country_code ?? '').toUpperCase();
        setCountry(code || null);
        setBlocked(code ? blockedList.includes(code) : false);
      })
      .catch(() => {
        if (!mounted) return;
        setBlocked(false);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { blocked, country, loading };
}

export function GeoBlockBanner() {
  const { blocked, country, loading } = useGeoBlock();

  if (loading || !blocked) return null;

  return (
    <div className="border border-red-500/40 bg-red-500/10 p-4 text-sm">
      <p className="font-bold text-red-300">Sale unavailable in your region</p>
      <p className="mt-1 text-muted">
        Token sale participation is not available from {country ?? 'your location'}. This offering is
        restricted per our compliance policy.
      </p>
    </div>
  );
}
