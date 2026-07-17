'use client';

import { ButtonLink } from '@/components/ui/button';

const SAMPLES = [
  {
    label: 'JavaScript',
    code: `import { Gami } from '@gami/sdk'

const gami = new Gami({ apiKey: process.env.GAMI_KEY })
await gami.quests.complete('onboarding-01', { userId })`,
  },
  {
    label: 'React',
    code: `import { useGami } from '@gami/react'

export function ClaimButton() {
  const { completeQuest } = useGami()
  return <button onClick={() => completeQuest('daily-checkin')}>Claim XP</button>
}`,
  },
];

export function DevelopersSection() {
  return (
    <section id="developers" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
            Developers
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
            Integrate in minutes
          </h2>
          <p className="mt-4 text-zinc-400">
            Drop in the SDK, emit verified actions, and let Gami handle rewards, identity, and
            settlement.
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-sm text-zinc-300">
            <p className="text-zinc-500"># install</p>
            <p>npm install @gami/sdk</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/developers">Read Documentation</ButtonLink>
            <ButtonLink href="https://github.com/Gami-Protocol" variant="secondary">
              GitHub
            </ButtonLink>
            <ButtonLink href="/waitlist" variant="ghost">
              Developer Waitlist
            </ButtonLink>
          </div>
        </div>

        <div className="space-y-4">
          {SAMPLES.map((sample) => (
            <div
              key={sample.label}
              className="overflow-hidden rounded-3xl border border-white/8 bg-[#0c0c10]"
            >
              <div className="border-b border-white/8 px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                {sample.label}
              </div>
              <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-zinc-300 md:text-sm">
                <code>{sample.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
