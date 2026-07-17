import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-28 md:px-8">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Legal</p>
      <h1 className="font-[family-name:var(--font-syne)] text-4xl font-semibold">Terms of Use</h1>
      <div className="prose prose-invert mt-8 max-w-none text-zinc-300">
        <p>
          By using gamiprotocol.io you agree to use the site for lawful purposes. Protocol features,
          token details, and timelines may change and are not offers to sell securities.
        </p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm text-secondary">
        ← Home
      </Link>
    </div>
  );
}
