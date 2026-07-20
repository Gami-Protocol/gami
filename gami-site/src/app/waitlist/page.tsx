import type { Metadata } from 'next';
import { WaitlistForm } from '@/components/waitlist-form';

export const metadata: Metadata = {
  title: 'Waitlist',
  description: 'Join the Gami waitlist for wallet beta, SDK access, partner programs, and updates.',
};

export default function WaitlistPage() {
  return (
    <div className="relative overflow-hidden pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[50vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(108,59,255,0.28),transparent_65%)] blur-2xl" />
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-24 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <div className="pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
            Waitlist
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
            You are early.
          </h1>
          <p className="mt-4 max-w-md text-zinc-400">
            Join for wallet beta, developer SDK, partner program, enterprise demos, and future token
            updates. Referrals welcome.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-300">
            <li>· Priority wallet beta access</li>
            <li>· SDK and partner onboarding</li>
            <li>· Live updates to waitlist@gamiprotocol.io</li>
          </ul>
          <p className="mt-8 text-sm text-zinc-400">
            Watch the counter live at{' '}
            <a href="/waitlist/live" className="text-accent underline-offset-4 hover:underline">
              /waitlist/live
            </a>
            .
          </p>
        </div>
        <div className="glass rounded-[2rem] p-6 md:p-8">
          <WaitlistForm />
        </div>
      </div>
    </div>
  );
}
