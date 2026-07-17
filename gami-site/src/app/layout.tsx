import type { Metadata } from 'next';
import { Geist, Geist_Mono, Syne } from 'next/font/google';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gamiprotocol.io'),
  title: {
    default: 'Gami Protocol — Universal AI Gamification Layer',
    template: '%s · Gami Protocol',
  },
  description:
    'Reward every interaction across apps, chains, and AI. Gami is the infrastructure for intelligent rewards, quests, loyalty, and engagement.',
  openGraph: {
    title: 'Gami Protocol — Universal AI Gamification Layer',
    description:
      'Reward every interaction across apps, chains, and AI. Download the wallet or join the waitlist.',
    url: 'https://gamiprotocol.io',
    siteName: 'Gami Protocol',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gami Protocol',
    description: 'The Universal AI Gamification Layer',
  },
  icons: {
    icon: [{ url: '/favicon.svg' }, { url: '/favicon.png' }],
    apple: '/brand/gami-logo-universal.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased`}
      >
        <Providers>
          <div className="noise relative min-h-screen">
            <SiteNav />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
