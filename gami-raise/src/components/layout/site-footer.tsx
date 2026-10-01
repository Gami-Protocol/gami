import Link from 'next/link';

import { GamiWordmark } from '@/components/brand/logo';

const FOOTER = [
  {
    title: 'Raise',
    links: [
      { href: '/raise', label: 'Raise portal' },
      { href: '/ico', label: 'ICO overview' },
      { href: '/tge', label: 'TGE' },
      { href: '/waitlist', label: 'Waitlist' },
    ],
  },
  {
    title: 'Network',
    links: [
      { href: '/partners', label: 'Partners' },
      { href: '/developers', label: 'Developers' },
      { href: '/investors', label: 'Investors' },
      { href: '/community', label: 'Community' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs', label: 'Docs' },
      { href: '/roadmap', label: 'Roadmap' },
      { href: '/blog', label: 'Blog' },
      { href: '/token', label: 'Token' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-black/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <GamiWordmark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
            Official Gami Protocol fundraising portal for ICO participation, TGE registration,
            partner onboarding, and community access.
          </p>
        </div>
        {FOOTER.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
              {column.title}
            </p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-white/35">
        © {new Date().getFullYear()} Gami Protocol. All rights reserved.
      </div>
    </footer>
  );
}
