import { Link } from 'react-router-dom';

import { GamiLogo } from '@/components/gami/GamiLogo';

export function GamiFooter({ variant = 'default' }: { variant?: 'default' | 'ico' }) {
  const isIco = variant === 'ico';

  return (
    <footer className="border-t-4 border-black bg-gami-bg pb-10 pt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="mb-8 flex items-center gap-3">
              <div className="gami-gradient neo-border flex h-8 w-8 items-center justify-center">
                <GamiLogo className="h-5 w-5" />
              </div>
              <span className="font-display text-2xl font-bold uppercase italic tracking-tight">GAMI PROTOCOL</span>
            </div>
            <p className="mb-8 max-w-xs text-gray-500">The modular on-chain engine for the internet&apos;s rewards layer.</p>
            <div className="flex gap-4">
              <a href="#" className="flex h-10 w-10 items-center justify-center border border-white/10 transition-all hover:bg-gami-purple">
                𝕏
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center border border-white/10 font-bold italic transition-all hover:bg-gami-purple">
                DI
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center border border-white/10 font-bold italic transition-all hover:bg-gami-purple">
                TG
              </a>
            </div>
          </div>

          <div>
            <h4 className={`mb-6 font-display text-sm font-bold uppercase tracking-widest ${isIco ? 'text-gami-accent' : ''}`}>
              Product
            </h4>
            <ul className={`space-y-4 text-sm ${isIco ? 'text-xs font-bold uppercase tracking-widest text-gray-500' : 'text-gray-500'}`}>
              <li><Link to="/wallet" className="transition-colors hover:text-white">App Dashboard</Link></li>
              <li><Link to="/wallet" className="transition-colors hover:text-white">AI Agents</Link></li>
              <li><Link to="/wallet" className="transition-colors hover:text-white">{isIco ? 'Wallet' : 'Wallet Extension'}</Link></li>
              <li><Link to="/whitepaper" className="transition-colors hover:text-white">Gami L2</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={`mb-6 font-display text-sm font-bold uppercase tracking-widest ${isIco ? 'text-gami-accent' : ''}`}>
              {isIco ? 'Devs' : 'Developers'}
            </h4>
            <ul className={`space-y-4 text-sm ${isIco ? 'text-xs font-bold uppercase tracking-widest text-gray-500' : 'text-gray-500'}`}>
              <li><Link to="/whitepaper" className="transition-colors hover:text-white">Documentation</Link></li>
              <li><Link to="/whitepaper" className="transition-colors hover:text-white">SDK Reference</Link></li>
              <li><Link to="/whitepaper" className="transition-colors hover:text-white">API Keys</Link></li>
              <li><Link to="/whitepaper" className="transition-colors hover:text-white">Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={`mb-6 font-display text-sm font-bold uppercase tracking-widest ${isIco ? 'text-gami-accent' : 'Company'}`}>
              {isIco ? 'Ecosystem' : 'Company'}
            </h4>
            <ul className={`space-y-4 text-sm ${isIco ? 'text-xs font-bold uppercase tracking-widest text-gray-500' : 'text-gray-500'}`}>
              {isIco ? (
                <>
                  <li><Link to="/waitlist" className="transition-colors hover:text-white">Token Sale</Link></li>
                  <li><Link to="/sale" className="transition-colors hover:text-white">Staking</Link></li>
                  <li><Link to="/whitepaper" className="transition-colors hover:text-white">Grants</Link></li>
                  <li><Link to="/legal/terms" className="transition-colors hover:text-white">Terms</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/whitepaper" className="transition-colors hover:text-white">About Us</Link></li>
                  <li><Link to="/whitepaper" className="transition-colors hover:text-white">Careers</Link></li>
                  <li><Link to="/legal/privacy" className="transition-colors hover:text-white">Privacy</Link></li>
                  <li><Link to="/legal/terms" className="transition-colors hover:text-white">Terms</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className={`flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-10 font-mono uppercase tracking-widest text-gray-600 ${isIco ? 'text-[10px]' : 'text-xs'}`}>
          <p>
            {isIco
              ? '© 2024 GAMI PROTOCOL FOUNDATION. SECURING THE REWARDS LAYER.'
              : '© 2024 GAMI PROTOCOL FOUNDATION. ALL RIGHTS RESERVED.'}
          </p>
          <div className="flex gap-6">
            {isIco ? (
              <>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                  PROTOCOL_ONLINE
                </span>
                <span>BUILD_V_0.9.1_STABLE</span>
              </>
            ) : (
              <>
                <span>Build 0.8.2-stable</span>
                <span className="text-green-500">● Network Live</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
