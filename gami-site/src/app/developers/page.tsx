import type { Metadata } from 'next';
import { DevelopersSection } from '@/components/sections/developers-section';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Developers',
  description: 'Integrate Gami SDK, APIs, and MCP for rewards, quests, and identity.',
};

export default function DevelopersPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Developers
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
          Build with Gami
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          JavaScript, React, React Native, Unity, and REST — ship verified rewards without building
          custom engagement infra.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="#sdk">Read Documentation</ButtonLink>
          <ButtonLink href="https://github.com/Gami-Protocol" variant="secondary">
            GitHub
          </ButtonLink>
          <ButtonLink href="#api" variant="ghost">
            API Reference
          </ButtonLink>
        </div>
      </div>
      <div id="sdk">
        <DevelopersSection />
      </div>
      <section id="api" className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="rounded-3xl border border-white/8 bg-card p-8">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold">
            API Reference
          </h2>
          <p className="mt-3 text-zinc-400">
            REST endpoints for quests, rewards, identity, and partner analytics. Full OpenAPI docs
            ship with the developer launch.
          </p>
          <div className="mt-6">
            <ButtonLink href="/waitlist">Join Developer Waitlist</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
