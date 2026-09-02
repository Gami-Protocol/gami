'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createReferralCode, shortenAddress } from '@/lib/utils';

export default function DashboardPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const wallet = user?.wallet?.address;
  const referral = createReferralCode(wallet ?? user?.id ?? 'guest');

  if (!ready) {
    return (
      <PageShell eyebrow="Dashboard" title="Loading account…">
        <Card>Preparing Privy session…</Card>
      </PageShell>
    );
  }

  if (!authenticated) {
    return (
      <PageShell
        eyebrow="Dashboard"
        title="Sign in to view your raise dashboard"
        description="Your allocation, XP, referrals, and TGE readiness live here."
        actions={<Button onClick={() => login()}>Sign in with Privy</Button>}
      >
        <Card>
          <CardTitle>Access required</CardTitle>
          <CardDescription>
            Connect an embedded or external wallet to sync your raise profile.
          </CardDescription>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Dashboard"
      title="Your raise command center"
      description="Track registration progress, referrals, XP, and allocation readiness."
      actions={
        <>
          <Button asChild>
            <Link href="/raise">Continue raise flow</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/tge">TGE status</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Wallet', wallet ? shortenAddress(wallet) : 'Pending'],
          ['Email', user?.email?.address ? 'Linked' : 'Missing'],
          ['XP', '0'],
          ['Referral', referral],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
            <CardTitle className="mt-2 text-base">{value}</CardTitle>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Onboarding progress</CardTitle>
          <CardDescription>Complete raise steps to unlock contribution eligibility.</CardDescription>
          <Progress className="mt-5" value={35} />
          <p className="mt-3 text-sm text-white/50">35% complete · finish profile + eligibility</p>
        </Card>
        <Card>
          <CardTitle>Allocation snapshot</CardTitle>
          <CardDescription>Reserved GAMI appears after contribution indexing.</CardDescription>
          <div className="mt-5 space-y-3 text-sm">
            <Row label="Contributed" value="$0" />
            <Row label="Reserved GAMI" value="0" />
            <Row label="Claimable at TGE" value="—" />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="text-white/45">{label}</span>
      <span>{value}</span>
    </div>
  );
}
