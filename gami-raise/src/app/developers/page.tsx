import Link from 'next/link';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Developers',
  description: 'Gami developer portal for API keys, SDKs, analytics, and webhook logs.',
};

const TILES = [
  ['API keys', 'Create project credentials with role-scoped access.'],
  ['SDKs', 'TypeScript and mobile kits for quests, XP, and claims.'],
  ['Analytics', 'Track verified events and conversion funnels.'],
  ['Webhook logs', 'Inspect delivery retries and signature failures.'],
];

export default function DevelopersPage() {
  return (
    <PageShell
      eyebrow="Developers"
      title="Developer portal"
      description="Manage projects, keys, SDKs, analytics, and webhook observability for Gami integrations."
      actions={
        <Button asChild>
          <Link href="/docs">Open docs</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {TILES.map(([title, detail]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
