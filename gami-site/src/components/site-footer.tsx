import Link from 'next/link';
import Image from 'next/image';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/wallet', label: 'Wallet' },
      { href: '/ai', label: 'AI' },
      { href: '/roadmap', label: 'Roadmap' },
      { href: '/waitlist', label: 'Waitlist' },
    ],
  },
  {
    title: 'Build',
    links: [
      { href: '/developers', label: 'Developers' },
      { href: '/partners', label: 'Partners' },
      { href: '/developers#sdk', label: 'SDK' },
      { href: '/developers#api', label: 'API Reference' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/#token', label: 'Token' },
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' },
      { href: 'mailto:hello@gamiprotocol.io', label: 'Contact' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-black/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/brand/gami-logo-universal.png"
              alt="Gami"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="font-[family-name:var(--font-syne)] text-lg font-semibold">Gami</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
            AI-powered universal gamification infrastructure for apps, chains, and enterprises.
          </p>
          <div className="mt-6 flex gap-4 text-sm text-zinc-400">
            <a href="https://x.com" className="hover:text-white" target="_blank" rel="noreferrer">
              X
            </a>
            <a href="https://discord.com" className="hover:text-white" target="_blank" rel="noreferrer">
              Discord
            </a>
            <a href="https://linkedin.com" className="hover:text-white" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href="https://github.com/Gami-Protocol" className="hover:text-white" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              {col.title}
            </h3>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Gami Protocol. All rights reserved.</p>
          <p>gamiprotocol.io</p>
        </div>
      </div>
    </footer>
  );
}
