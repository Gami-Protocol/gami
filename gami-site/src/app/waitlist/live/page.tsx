import type { Metadata } from 'next';
import { WaitlistLive } from '@/components/waitlist-live';

export const metadata: Metadata = {
  title: 'Live Waitlist',
  description: 'Watch Gami Protocol waitlist signups in real time and subscribe to email alerts.',
  alternates: {
    canonical: 'https://gamiprotocol.io/waitlist/live',
  },
};

export default function WaitlistLivePage() {
  return (
    <div className="relative overflow-hidden pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[50vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(63,169,255,0.22),transparent_65%)] blur-2xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Live feed
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
          Waitlist counter
        </h1>
        <p className="mt-4 mb-10 max-w-xl text-zinc-400">
          Watch signups in real time, and send live count updates whenever someone joins the genesis
          waitlist.
        </p>
        <WaitlistLive />
      </div>
    </div>
  );
}
