import type { Metadata } from 'next';
import { PartnersSection } from '@/components/sections/partners-section';

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Launch gamified experiences with Gami SDK, dashboard, analytics, and rewards.',
};

export default function PartnersPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Partners
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
          Become a Gami partner
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Gaming, retail, e-commerce, AI, fintech, enterprise, creators, and education — one
          engagement layer.
        </p>
      </div>
      <PartnersSection />
    </div>
  );
}
