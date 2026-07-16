'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { GamiWordmark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { NAV_LINKS } from '@/lib/constants';
import { cn, shortenAddress } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [open, setOpen] = useState(false);
  const wallet = user?.wallet?.address;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" onClick={() => setOpen(false)}>
          <GamiWordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-3 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-white',
                pathname === link.href && 'bg-white/10 text-white',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/waitlist">Waitlist</Link>
          </Button>
          <Button
            size="sm"
            disabled={!ready}
            onClick={() => (authenticated ? logout() : login())}
          >
            {!ready
              ? 'Loading…'
              : authenticated
                ? wallet
                  ? shortenAddress(wallet)
                  : 'Signed in'
                : 'Sign in'}
          </Button>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-black/95 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-3 text-sm text-white/80 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-3 py-3 text-sm text-white/80 hover:bg-white/5"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
