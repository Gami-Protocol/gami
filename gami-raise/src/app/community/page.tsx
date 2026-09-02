import Link from 'next/link';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Community',
  description: 'Gami community hub for waitlist, XP, referrals, and leaderboard.',
};

export default function CommunityPage() {
  return (
    <PageShell
      eyebrow="Community"
      title="Community hub"
      description="Earn XP, climb the leaderboard, share referrals, and stay ready for TGE."
      actions={
        <>
          <Button asChild>
            <Link href="/waitlist">Join waitlist</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/raise">Open raise</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['XP & quests', 'Complete raise quests for multipliers and badges.'],
          ['Referrals', 'Invite builders and earn attribution XP.'],
          ['Leaderboard', 'Compete for early community recognition.'],
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
