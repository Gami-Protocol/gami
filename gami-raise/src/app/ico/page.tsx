import Link from 'next/link';

import { GamiBrandLogo } from '@/components/brand/logo';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RAISE_STEPS } from '@/lib/constants';

export const metadata = {
  title: 'ICO',
  description: 'Gami Protocol ICO overview, phases, and participation requirements.',
};

export default function IcoPage() {
  return (
    <PageShell
      eyebrow="ICO"
      title="Initial contribution offering"
      description="Phase-gated sale on Base with Privy authentication, whitelist proofs, and post-sale vesting distribution."
      actions={
        <Button asChild>
          <Link href="/raise">Start participation</Link>
        </Button>
      }
    >
      <GamiBrandLogo variant="raise" className="mb-8 h-14 w-14" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Participation path</CardTitle>
          <CardDescription>Complete every gate before contribution opens.</CardDescription>
          <ol className="mt-5 space-y-3">
            {RAISE_STEPS.map((step, index) => (
              <li key={step.id} className="flex gap-3 text-sm">
                <span className="text-[#cbbdff]">{index + 1}.</span>
                <span>
                  <span className="font-medium text-white">{step.title}</span>
                  <span className="block text-white/50">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardTitle>Sale phases</CardTitle>
          <CardDescription>Seed and private rounds require merkle whitelist proofs.</CardDescription>
          <div className="mt-5 space-y-3">
            {['Waitlist', 'Seed', 'Private', 'Public', 'TGE'].map((phase) => (
              <div
                key={phase}
                className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm"
              >
                {phase}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
