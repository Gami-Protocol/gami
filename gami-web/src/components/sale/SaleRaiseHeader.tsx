import { Link, useLocation } from 'react-router-dom';

import { ConnectWallet } from '@/components/ConnectWallet';
import { GamiLogo } from '@/components/gami/GamiLogo';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/waitlist', label: 'Waitlist' },
  { href: '/sale', label: 'Token Sale' },
  { href: '/wallet', label: 'Launch App' },
] as const;

interface SaleRaiseHeaderProps {
  raised?: number;
  cap?: number;
  showProgress?: boolean;
}

export function SaleRaiseHeader({ raised, cap, showProgress = false }: SaleRaiseHeaderProps) {
  const { pathname } = useLocation();
  const pct = raised && cap && cap > 0 ? Math.min(100, (raised / cap) * 100) : 0;

  return (
    <header className="sticky top-0 z-50 border-y-[3px] border-black bg-[#131118] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="flex items-center gap-3 font-display font-bold transition hover:opacity-90">
          <span className="flex h-11 w-11 rotate-3 items-center justify-center border-2 border-white bg-[#7047eb]">
            <GamiLogo className="h-6 w-6" />
          </span>
          <span className="leading-[0.85] tracking-tight">
            GAMI
            <br />
            PROTOCOL
          </span>
        </Link>

        <nav className="hidden items-center gap-5 font-mono text-[11px] font-bold uppercase tracking-wider md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`transition-colors hover:text-[#ffeb55] ${
                pathname === link.href ? 'text-[#ffeb55] underline decoration-2 underline-offset-4' : 'text-white/80'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {showProgress && raised !== undefined && cap !== undefined && (
            <div className="hidden items-center gap-3 font-mono text-xs sm:flex sm:text-sm">
              <span className="border border-[#67f5a1] px-3 py-2 font-bold text-[#67f5a1]">
                <span className="mr-2 animate-pulse">●</span>RAISE LIVE
              </span>
              <span className="font-bold">
                ${raised.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
                {cap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          <ConnectWallet variant="sale" />
        </div>
      </div>

      <nav className="flex gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className={`whitespace-nowrap ${pathname === link.href ? 'text-[#ffeb55]' : 'text-white/70'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {showProgress && raised !== undefined && cap !== undefined && (
        <div className="h-2 bg-white/15">
          <div className="h-full bg-[#ffeb55] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      )}
    </header>
  );
}
