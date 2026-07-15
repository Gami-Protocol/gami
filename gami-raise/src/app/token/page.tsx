import Link from 'next/link';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RAISE, TOKENOMICS } from '@/lib/constants';

export const metadata = {
  title: 'Token',
  description: 'GAMI tokenomics, supply, vesting, staking, governance, and treasury overview.',
};

const FEATURES = [
  ['Supply dashboard', 'Track circulating supply, burns, and treasury balances.'],
  ['Vesting', `${RAISE.tgeUnlockBps / 100}% TGE unlock, then linear over ${RAISE.vestingDays} days.`],
  ['Staking', 'Boost XP multipliers and unlock premium partner tiers.'],
  ['Governance', 'Vote on fees, reward formulas, and ecosystem grants.'],
  ['Treasury', 'Transparent protocol reserves and incentive budgets.'],
  ['Marketplace', 'Future utility surfaces for partner campaigns and rewards.'],
];

export default function TokenPage() {
  return (
    <PageShell
      eyebrow="Token"
      title="$GAMI token surfaces"
      description="Allocation status, vesting schedule, governance utility, and treasury visibility for raise participants."
      actions={
        <>
          <Button asChild>
            <Link href="/tge">TGE countdown</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/raise">Raise flow</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardTitle>Tokenomics</CardTitle>
          <CardDescription>Fixed 1,000,000,000 $GAMI supply with usage-linked burn.</CardDescription>
          <div className="mt-6 space-y-4">
            {TOKENOMICS.map((item) => (
              <div key={item.bucket}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{item.bucket}</span>
                  <span className="text-white/50">{item.pct}%</span>
                </div>
                <Progress value={item.pct} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Allocation status</CardTitle>
          <CardDescription>
            Participants can review reserved GAMI, claimed amounts, and unlock schedule from the
            dashboard after registration.
          </CardDescription>
          <div className="mt-6 grid gap-3">
            {[
              ['Price', `$${RAISE.priceUsd}`],
              ['Hard cap', `$${RAISE.hardCapUsd.toLocaleString()}`],
              ['TGE unlock', `${RAISE.tgeUnlockBps / 100}%`],
              ['Vesting', `${RAISE.vestingDays} days`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl border border-white/8 px-4 py-3 text-sm"
              >
                <span className="text-white/50">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map(([title, detail]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
