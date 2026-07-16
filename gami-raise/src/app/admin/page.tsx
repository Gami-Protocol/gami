import { PageShell } from '@/components/layout/page-shell';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Admin',
  description: 'Admin console for raise operations, approvals, and audit logs.',
};

const PANELS = [
  ['Waitlist', 'Export and segment waitlist intent.'],
  ['KYC queue', 'Review and approve eligibility states.'],
  ['Partner approvals', 'Accept or reject partner applications.'],
  ['Investor desk', 'Manage meeting and data-room requests.'],
  ['TGE controls', 'Toggle claim windows and countdown targets.'],
  ['Audit logs', 'Immutable action history across roles.'],
];

export default function AdminPage() {
  return (
    <PageShell
      eyebrow="Admin"
      title="Operations console"
      description="Role-gated tools for raise operators. Wire PRIVY role claims before enabling mutations in production."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PANELS.map(([title, detail]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
