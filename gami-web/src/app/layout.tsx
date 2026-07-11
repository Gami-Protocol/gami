import type { Metadata } from 'next';
import './globals.css';
import { GamiNav } from '@/components/gami/GamiNav';
import { Providers } from '@/components/Providers';
import { CookieConsent } from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'Gami Protocol — Universal Gamification Infrastructure',
  description:
    'Earn XP, rewards, and tokens across apps and games using Gami Protocol\'s AI-powered gamification engine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="hexagon-bg min-h-screen font-sans text-white selection:bg-gami-accent selection:text-white">
        <Providers>
          <GamiNav />
          <main>{children}</main>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
