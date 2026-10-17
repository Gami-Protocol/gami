import { PageShell } from '@/components/layout/page-shell';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Roadmap',
  description: 'Gami Protocol raise, TGE, and platform roadmap.',
};

const MILESTONES = [
  ['Q3', 'Raise portal + waitlist + Privy onboarding'],
  ['Q3', 'Partner and developer application rails'],
  ['Q4', 'Public sale window + contribution indexing'],
  ['Q4', 'TGE claim open + vesting schedules'],
  ['Later', 'Staking, governance, and marketplace expansion'],
];

export default function RoadmapPage() {
  return (
    <PageShell
      eyebrow="Roadmap"
      title="Execution roadmap"
      description="Milestones from fundraising readiness through TGE and post-launch utility."
    >
      <div className="space-y-3">
        {MILESTONES.map(([when, detail], index) => (
          <Card key={`${when}-${index}`} className="flex items-start gap-4">
            <span className="rounded-full bg-[#6C3BFF]/20 px-3 py-1 text-xs font-semibold text-[#cbbdff]">
              {when}
            </span>
            <div>
              <CardTitle className="text-base">{detail}</CardTitle>
              <CardDescription>Tracked in admin with audit-ready status changes.</CardDescription>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
