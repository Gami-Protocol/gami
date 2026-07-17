import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        Gami Protocol collects waitlist and product analytics information to operate the protocol
        website, wallet waitlist, and partner onboarding. Contact{' '}
        <a href="mailto:hello@gamiprotocol.io">hello@gamiprotocol.io</a> for data requests.
      </p>
    </LegalShell>
  );
}

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-28 md:px-8">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Legal</p>
      <h1 className="font-[family-name:var(--font-syne)] text-4xl font-semibold">{title}</h1>
      <div className="prose prose-invert mt-8 max-w-none text-zinc-300">{children}</div>
      <Link href="/" className="mt-10 inline-block text-sm text-secondary">
        ← Home
      </Link>
    </div>
  );
}
