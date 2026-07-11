import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {children}
      <footer className="mt-12 border-t border-white/10 pt-6 font-mono text-xs text-muted">
        <Link href="/legal/terms" className="mr-4 hover:text-white">
          Terms
        </Link>
        <Link href="/legal/privacy" className="mr-4 hover:text-white">
          Privacy
        </Link>
        <Link href="/legal/risk" className="hover:text-white">
          Risk Disclosure
        </Link>
      </footer>
    </div>
  );
}
