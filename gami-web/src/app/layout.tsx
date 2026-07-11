import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Gami Protocol — Smart Burn & Stable Spend Economy',
  description: 'AI-powered token economy with sustainable tokenomics, real-world payments, and universal gamification.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="gradient-hero min-h-screen">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
