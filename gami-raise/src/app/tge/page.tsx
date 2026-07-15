import Link from 'next/link';

import { PageShell } from '@/components/layout/page-shell';
import { TgeCountdown } from '@/components/tge/countdown';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RAISE } from '@/lib/constants';

export const metadata = {
  title: 'TGE',
  description: 'Token Generation Event countdown, claim readiness, and unlock schedule.',
};

export default function TgePage() {
  return (
    <PageShell
      eyebrow="TGE"
      title="Token Generation Event"
      description="Track countdown, claim readiness, and vesting unlocks for registered participants."
      actions={
        <Button asChild>
          <Link href="/dashboard">Check allocation</Link>
        </Button>
      }
    >
      <Card className="max-w-3xl">
        <CardTitle>Countdown</CardTitle>
        <CardDescription>
          Target window is configurable via admin. Placeholder set for planning surfaces.
        </CardDescription>
        <div className="mt-6">
          <TgeCountdown />
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['TGE unlock', `${RAISE.tgeUnlockBps / 100}% available at claim open`],
          ['Linear vest', `${RAISE.vestingDays}-day schedule after TGE`],
          ['Claim path', 'Dashboard + wallet claim after vesting contracts finalize'],
        ].map(([title, detail]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
