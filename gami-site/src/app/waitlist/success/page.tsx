import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'You are now part of Gami',
};

export default async function WaitlistSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center px-5 py-28 md:px-8">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
        Success
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
        You are now part of Gami.
      </h1>
      <p className="mt-4 text-zinc-400">
        {email
          ? `We saved ${email} to the waitlist database.`
          : 'Your waitlist spot is confirmed.'}{' '}
        Next: download the wallet or explore the developer docs.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/wallet" size="lg">
          Download Wallet
        </ButtonLink>
        <ButtonLink href="/developers" variant="secondary" size="lg">
          Read Docs
        </ButtonLink>
        <ButtonLink href="/" variant="ghost" size="lg">
          Back home
        </ButtonLink>
      </div>
      <p className="mt-10 text-sm text-zinc-500">
        Questions? Ask <Link href="/ai" className="text-secondary hover:text-white">Gami AI</Link>.
      </p>
    </div>
  );
}
