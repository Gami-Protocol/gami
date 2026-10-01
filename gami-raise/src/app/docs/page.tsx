import { PageShell } from '@/components/layout/page-shell';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Docs',
  description: 'Gami Raise platform documentation for participants, partners, and developers.',
};

const DOCS = [
  ['Raise flow', 'Wallet connect → verification → eligibility → registration → dashboard.'],
  ['Privy auth', 'Embedded wallets, social login, JWT session bridging, and role sync.'],
  ['Contracts', 'TokenSale, VestingVault, USDC contribution path on Base.'],
  ['Security', 'Turnstile, rate limits, RBAC, audit logs, encrypted sensitive fields.'],
];

export default function DocsPage() {
  return (
    <PageShell
      eyebrow="Docs"
      title="Platform documentation"
      description="Implementation notes for the raise portal, auth model, and stakeholder surfaces."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {DOCS.map(([title, detail]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
