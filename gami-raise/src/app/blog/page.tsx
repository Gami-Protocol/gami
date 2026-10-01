import { PageShell } from '@/components/layout/page-shell';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Blog',
  description: 'Updates from the Gami Protocol raise and ecosystem.',
};

const POSTS = [
  {
    title: 'Announcing the Gami Raise Platform',
    detail: 'A single portal for ICO, TGE, partners, developers, and community onboarding.',
  },
  {
    title: 'Why Privy wallets for fundraising UX',
    detail: 'Embedded wallets reduce drop-off while still supporting external wallet users.',
  },
  {
    title: 'TGE readiness checklist',
    detail: 'Allocations, vesting, claims, disclosures, and support runbooks.',
  },
];

export default function BlogPage() {
  return (
    <PageShell
      eyebrow="Blog"
      title="Updates & essays"
      description="Product notes and raise communications for the Gami community."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {POSTS.map((post) => (
          <Card key={post.title}>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription>{post.detail}</CardDescription>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
