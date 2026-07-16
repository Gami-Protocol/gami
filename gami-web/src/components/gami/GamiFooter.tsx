import { Link } from 'react-router-dom';

import { GamiBrandLogo } from '@/components/gami/GamiBrandLogo';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';

const linkClass = 'transition-colors hover:text-white';

export function GamiFooter({ variant = 'default' }: { variant?: 'default' | 'ico' }) {
  const isIco = variant === 'ico';

  return (
    <footer className="border-t-4 border-black bg-gami-bg pb-10 pt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="mb-8 flex items-center gap-3">
              {isIco ? (
                <GamiTokenLogo className="h-10 w-10" />
              ) : (
                <GamiBrandLogo variant="universal" className="h-10 w-10 neo-border" />
              )}
              <span className="font-display text-2xl font-bold uppercase italic tracking-tight">
                GAMI PROTOCOL
              </span>
            </div>
            <p className="mb-8 max-w-xs text-gray-500">
              The modular on-chain engine for the internet&apos;s rewards layer.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/gamiprotocol"
                target="_blank"
                rel="noreferrer"
                aria-label="Gami Protocol on X"
                className="flex h-10 w-10 items-center justify-center border border-white/10 transition-all hover:bg-gami-purple"
              >
                𝕏
              </a>
              <a
                href="https://discord.gg/9Y8vpDAhbD"
                target="_blank"
                rel="noreferrer"
                aria-label="Join Gami Protocol on Discord"
                className="flex h-10 w-10 items-center justify-center border border-white/10 transition-all hover:bg-gami-purple"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52l-.61 1.26a18.3 18.3 0 0 0-5.63 0l-.62-1.26a19.7 19.7 0 0 0-4.89 1.53C.59 9.1-.24 13.7.18 18.24a19.9 19.9 0 0 0 6 3.03l1.48-2.02a12.8 12.8 0 0 1-2.33-1.12l.57-.44a14.2 14.2 0 0 0 12.2 0l.58.44c-.74.44-1.52.82-2.34 1.12l1.48 2.02a19.8 19.8 0 0 0 6-3.03c.5-5.27-.86-9.83-3.5-13.87ZM8.02 15.46c-1.17 0-2.13-1.08-2.13-2.4 0-1.33.94-2.41 2.13-2.41 1.2 0 2.15 1.09 2.13 2.4 0 1.33-.94 2.41-2.13 2.41Zm7.96 0c-1.17 0-2.13-1.08-2.13-2.4 0-1.33.94-2.41 2.13-2.41 1.2 0 2.15 1.09 2.13 2.4 0 1.33-.93 2.41-2.13 2.41Z" />
                </svg>
              </a>
              <a
                href="https://t.me/gamiprotocol"
                target="_blank"
                rel="noreferrer"
                aria-label="Join Gami Protocol on Telegram"
                className="flex h-10 w-10 items-center justify-center border border-white/10 transition-all hover:bg-gami-purple"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M11.94 0A12 12 0 1 0 24 12 12 12 0 0 0 11.94 0Zm4.97 7.22-1.98 9.3c-.14.65-.53.81-1.08.5l-3-2.21-1.45 1.4c-.16.16-.29.29-.59.29l.21-3.05 5.56-5.03c.25-.21-.05-.33-.37-.12l-6.87 4.33-2.96-.93c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.2 1.01.13.83.93Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4
              className={`mb-6 font-display text-sm font-bold uppercase tracking-widest ${isIco ? 'text-gami-accent' : ''}`}
            >
              Product
            </h4>
            <ul
              className={`space-y-4 text-sm ${isIco ? 'text-xs font-bold uppercase tracking-widest text-gray-500' : 'text-gray-500'}`}
            >
              <li>
                <Link to="/app" className={linkClass}>
                  App Dashboard
                </Link>
              </li>
              <li>
                <Link to="/agents" className={linkClass}>
                  AI Agents
                </Link>
              </li>
              <li>
                <Link to="/wallet" className={linkClass}>
                  {isIco ? 'Wallet' : 'Wallet Extension'}
                </Link>
              </li>
              <li>
                <Link to="/whitepaper" className={linkClass}>
                  Gami L2
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className={`mb-6 font-display text-sm font-bold uppercase tracking-widest ${isIco ? 'text-gami-accent' : ''}`}
            >
              {isIco ? 'Devs' : 'Developers'}
            </h4>
            <ul
              className={`space-y-4 text-sm ${isIco ? 'text-xs font-bold uppercase tracking-widest text-gray-500' : 'text-gray-500'}`}
            >
              <li>
                <Link to="/developers/docs" className={linkClass}>
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/developers/mcp-client" className={linkClass}>
                  MCP Client
                </Link>
              </li>
              <li>
                <Link to="/developers/mcp-server" className={linkClass}>
                  MCP Server
                </Link>
              </li>
              <li>
                <Link to="/status" className={linkClass}>
                  Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className={`mb-6 font-display text-sm font-bold uppercase tracking-widest ${isIco ? 'text-gami-accent' : ''}`}
            >
              {isIco ? 'Ecosystem' : 'Company'}
            </h4>
            <ul
              className={`space-y-4 text-sm ${isIco ? 'text-xs font-bold uppercase tracking-widest text-gray-500' : 'text-gray-500'}`}
            >
              {isIco ? (
                <>
                  <li>
                    <Link to="/sale" className={linkClass}>
                      Token Raise
                    </Link>
                  </li>
                  <li>
                    <Link to="/tokenomics" className={linkClass}>
                      Tokenomics + TGE
                    </Link>
                  </li>
                  <li>
                    <Link to="/claim" className={linkClass}>
                      Claim
                    </Link>
                  </li>
                  <li>
                    <Link to="/whitepaper" className={linkClass}>
                      Grants
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/terms" className={linkClass}>
                      Terms
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/about" className={linkClass}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/tokenomics" className={linkClass}>
                      Tokenomics + TGE
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:admin@gamiprotocol.io?subject=Gami%20Protocol%20Careers"
                      className={linkClass}
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <Link to="/legal/privacy" className={linkClass}>
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/terms" className={linkClass}>
                      Terms
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div
          className={`flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-10 font-mono uppercase tracking-widest text-gray-600 ${isIco ? 'text-[10px]' : 'text-xs'}`}
        >
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
