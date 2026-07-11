'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'gami-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-surface/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">
          We use cookies for analytics and to improve the sale experience. See our{' '}
          <a href="/legal/privacy" className="text-primary underline">
            Privacy Policy
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, 'accepted');
            setVisible(false);
          }}
          className="sticker-shadow bg-primary px-6 py-2 font-mono text-xs font-bold uppercase"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
