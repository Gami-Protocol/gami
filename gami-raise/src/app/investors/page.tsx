'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function InvestorsPage() {
  const [firm, setFirm] = useState('');
  const [checkSize, setCheckSize] = useState('250000');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    toast.success('Investor registration received');
    setFirm('');
  }

  return (
    <PageShell
      eyebrow="Investors"
      title="Investor portal"
      description="Register your fund, request meetings, access the pitch deck, and petition for data room access."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ['Pitch deck', 'Request the latest raise narrative and model.'],
          ['Meeting desk', 'Book time with the founding team.'],
          ['Data room', 'NDA-gated access for diligence materials.'],
        ].map(([title, detail]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </Card>
        ))}
      </div>

      <Card className="mt-6 max-w-xl">
        <CardTitle>Fund registration</CardTitle>
        <CardDescription>Tell us your firm and intended check size.</CardDescription>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Input
            required
            placeholder="Firm name"
            value={firm}
            onChange={(event) => setFirm(event.target.value)}
          />
          <Input
            type="number"
            placeholder="Check size (USD)"
            value={checkSize}
            onChange={(event) => setCheckSize(event.target.value)}
          />
          <Button type="submit" className="w-full">
            Register interest
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}
