import Link from 'next/link';

import { GamiBrandLogo } from '@/components/brand/logo';
import { PageShell } from '@/components/layout/page-shell';
import { RaiseFlow } from '@/components/raise/raise-flow';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RAISE } from '@/lib/constants';
import { formatUsd } from '@/lib/utils';

export const metadata = {
  title: 'Raise',
  description: 'Gami Protocol ICO raise onboarding and contribution portal.',
};

export default function RaisePage() {
  return (
    <PageShell
      eyebrow="Raise"
      title="Fund the universal rewards layer"
      description="Connect with Privy, complete eligibility, register as an investor, and prepare your $GAMI allocation ahead of TGE."
      actions={
        <>
          <Button asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/token">View tokenomics</Link>
          </Button>
        </>
      }
    >
      <div className="mb-8 flex items-center gap-4">
        <GamiBrandLogo variant="raise" className="h-16 w-16" priority />
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold">$GAMI Raise</p>
          <p className="text-sm text-white/50">Sale · claim · allocation mark</p>
        </div>
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          ['Hard cap', formatUsd(RAISE.hardCapUsd)],
          ['Min contribution', formatUsd(RAISE.minContributionUsd)],
          ['Per-wallet cap', formatUsd(RAISE.perWalletCapUsd)],
          ['TGE unlock', `${RAISE.tgeUnlockBps / 100}%`],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
            <CardTitle className="mt-2">{value}</CardTitle>
            <CardDescription>Configured for Base raise contracts.</CardDescription>
          </Card>
        ))}
      </div>
      <RaiseFlow />
    </PageShell>
  );
}
