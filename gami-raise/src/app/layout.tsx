import type { Metadata } from 'next';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { AppProviders } from '@/components/providers/app-providers';

import './globals.css';

const sans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const mono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

const display = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Gami Raise — Official Fundraising Portal',
    template: '%s · Gami Raise',
  },
  description:
    'Official Gami Protocol portal for ICO participation, TGE registration, waitlist, investor access, and partner onboarding.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: [{ url: '/brand/gami-logo-universal.png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}>
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
            <SiteHeader />
            <main className="relative flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
