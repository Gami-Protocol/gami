'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function PartnersPage() {
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [pitch, setPitch] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    toast.success('Partner application submitted for review');
    setCompany('');
    setWebsite('');
    setPitch('');
  }

  return (
    <PageShell
      eyebrow="Partners"
      title="Partner portal"
      description="Apply for ecosystem partnerships, request SDK access, and track approval status."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardTitle>Why partner with Gami</CardTitle>
          <CardDescription>
            Plug into universal XP, quest distribution, and on-chain settlement without building
            reward infra from scratch.
          </CardDescription>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li>• SDK and webhook integrations</li>
            <li>• Campaign analytics and reward routing</li>
            <li>• Co-marketing with raise and TGE moments</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Application</CardTitle>
          <CardDescription>Submissions enter under-review status for admin approval.</CardDescription>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <Input
              required
              placeholder="Company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
            <Input
              placeholder="Website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            <Input
              required
              placeholder="Pitch / integration intent"
              value={pitch}
              onChange={(event) => setPitch(event.target.value)}
            />
            <Button type="submit" className="w-full">
              Submit application
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
