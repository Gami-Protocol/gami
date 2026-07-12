import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Gami Agentic Quest',
  description: 'Agentic questing chat interface for the Gami Protocol AI Agent Layer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-dvh bg-infinity-bg`}
      >
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: 'infinity-panel infinity-glow border-infinity-violet/40',
            },
          }}
        />
      </body>
    </html>
  );
}
