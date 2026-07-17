import type { Metadata } from 'next';
import { RoadmapSection } from '@/components/sections/roadmap-section';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'Wallet, SDK, AI, partners, marketplace, L2, governance, enterprise, global launch.',
};

export default function RoadmapPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Roadmap
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
          Protocol milestones
        </h1>
      </div>
      <RoadmapSection />
    </div>
  );
}
