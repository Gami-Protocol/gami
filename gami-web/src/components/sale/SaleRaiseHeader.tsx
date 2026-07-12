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
    <header className="sticky top-0 z-50 w-full max-w-[100vw] border-y-[3px] border-black bg-[#131118] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 shrink items-center gap-2 font-display font-bold sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 rotate-3 items-center justify-center border-2 border-white bg-[#7047eb] sm:h-11 sm:w-11">
            <GamiLogo className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <span className="hidden leading-[0.85] tracking-tight sm:block">
            GAMI
            <br />
            PROTOCOL
          </span>
          <span className="text-sm font-bold sm:hidden">GAMI</span>
        </Link>

        <nav className="hidden items-center gap-5 font-mono text-[11px] font-bold uppercase tracking-wider lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`transition-colors hover:text-[#ffeb55] ${
                pathname === link.href
                  ? 'text-[#ffeb55] underline decoration-2 underline-offset-4'
                  : 'text-white/80'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="shrink-0">
          <ConnectWallet variant="sale" />
        </div>
      </div>

      {showProgress && raised !== undefined && cap !== undefined && (
        <div className="border-t border-white/10 px-4 py-2 sm:px-6 lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] font-bold sm:text-xs">
            <span className="border border-[#67f5a1] px-2 py-1 text-[#67f5a1] sm:px-3 sm:py-2">
              <span className="mr-1 animate-pulse sm:mr-2">●</span>RAISE LIVE
            </span>
            <span>
              ${raised.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
              {cap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      <nav className="flex gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider lg:hidden">
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
        <>
          <div className="hidden items-center justify-end gap-3 border-t border-white/10 px-6 py-2 font-mono text-sm font-bold lg:flex">
            <span className="border border-[#67f5a1] px-3 py-2 text-[#67f5a1]">
              <span className="mr-2 animate-pulse">●</span>RAISE LIVE
            </span>
            <span>
              ${raised.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
              {cap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="h-2 bg-white/15">
            <div className="h-full bg-[#ffeb55] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
    </header>
  );
}
