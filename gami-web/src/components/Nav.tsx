import Link from 'next/link';

import { ConnectWallet } from '@/components/ConnectWallet';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/tokenomics', label: 'Tokenomics' },
  { href: '/whitepaper', label: 'Whitepaper' },
  { href: '/sale', label: 'Sale' },
  { href: '/claim', label: 'Claim' },
  { href: '/wallet', label: 'Wallet' },
];

export function Nav() {
  return (
    <nav className="border-b border-white/10 px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold">
          <span className="text-white">GAMI</span>
          <span className="text-primary"> Protocol</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-white transition">
              {l.label}
            </Link>
          ))}
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
