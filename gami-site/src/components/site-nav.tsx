'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonLink } from '@/components/ui/button';

const LINKS = [
  { href: '/wallet', label: 'Wallet' },
  { href: '/developers', label: 'Developers' },
  { href: '/partners', label: 'Partners' },
  { href: '/ai', label: 'AI' },
  { href: '/roadmap', label: 'Roadmap' },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled || open
            ? 'border-b border-white/8 bg-[#09090b]/80 backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image
              src="/brand/gami-logo-universal.png"
              alt="Gami"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight">
              Gami
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ButtonLink href="/wallet" variant="secondary" size="sm">
              Download Wallet
            </ButtonLink>
            <ButtonLink href="/waitlist" size="sm">
              Join Waitlist
            </ButtonLink>
          </div>

          <button
            type="button"
            className="rounded-full p-2 text-white md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 bg-[#09090b]/95 px-6 pb-10 pt-24 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-6">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-[family-name:var(--font-syne)] text-3xl font-semibold"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              <ButtonLink href="/waitlist" onClick={() => setOpen(false)}>
                Join Waitlist
              </ButtonLink>
              <ButtonLink href="/wallet" variant="secondary" onClick={() => setOpen(false)}>
                Download Wallet
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
