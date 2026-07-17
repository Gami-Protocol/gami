import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ConnectWallet } from '@/components/ConnectWallet';
import { GamiBrandLogo } from '@/components/gami/GamiBrandLogo';

const NAV_LINKS = [
  { href: '/app', label: 'Product' },
  { href: '/agents', label: 'Agents' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/developers/docs', label: 'Developers' },
  { href: '/sale', label: 'Raise' },
  { href: '/tokenomics', label: 'Tokenomics' },
];

export function GamiNav() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.pageYOffset > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenu(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`fixed z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'border-b-2 border-black bg-gami-bg/80 py-3 backdrop-blur-xl'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link to="/" className="group flex items-center gap-3">
            <GamiBrandLogo
              variant="universal"
              className="h-10 w-10 neo-border transition-transform group-hover:rotate-12"
            />
            <span className="font-display text-2xl font-bold tracking-tight">GAMI</span>
          </Link>

          <div className="hidden items-center gap-8 font-display text-sm font-medium uppercase tracking-widest lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`transition-colors hover:text-gami-accent ${
                  pathname === link.href ? 'border-b-2 border-gami-accent text-gami-accent' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              to="/auth"
              className="font-display text-xs font-bold tracking-widest text-gray-300 transition-colors hover:text-gami-accent"
            >
              SIGN IN
            </Link>
            <Link
              to="/waitlist"
              className="border-2 border-white px-6 py-2 font-display text-xs font-bold tracking-widest transition-all hover:bg-white hover:text-black"
            >
              JOIN WAITLIST
            </Link>
            <Link
              to="/wallet"
              className="gami-gradient neo-border px-6 py-2 font-display text-xs font-bold tracking-widest shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              LAUNCH APP
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="p-2 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileMenu && (
        <div className="fixed inset-0 z-40 bg-gami-bg px-6 pt-24 lg:hidden">
          <div className="flex flex-col gap-6 font-display text-2xl font-bold uppercase">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.href} onClick={() => setMobileMenu(false)}>
                {link.label}
              </Link>
            ))}
            <hr className="border-white/10" />
            <Link to="/auth" onClick={() => setMobileMenu(false)}>
              Sign In
            </Link>
            <ConnectWallet />
            <Link
              to="/waitlist"
              className="gami-gradient neo-border p-4 text-center shadow-brutal"
              onClick={() => setMobileMenu(false)}
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
