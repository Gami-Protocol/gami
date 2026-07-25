import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { safeInternalPath } from '@/lib/seo';

/**
 * Handles OAuth / Privy / Firebase redirect landing paths.
 * Providers sometimes bounce to /auth/callback or /callback; without a route
 * the SPA still boots but users see a confusing "not found" or hang.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = params.get('error') || params.get('error_description');
    if (oauthError) {
      setError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
      return;
    }

    const next = safeInternalPath(
      params.get('next') || params.get('redirect_uri') || params.get('returnTo'),
      '/',
    );

    // Give wallet/auth SDKs a brief tick to consume hash/query tokens.
    const timer = window.setTimeout(() => {
      navigate(next, { replace: true });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [navigate, params]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Sign-in callback failed</h1>
        <p className="mt-3 text-sm text-white/70">{error}</p>
        <Link
          to="/auth"
          className="mt-6 rounded-lg bg-gami-accent px-4 py-2 text-sm font-medium text-white"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-white/70">Completing sign-in…</p>
    </div>
  );
}
