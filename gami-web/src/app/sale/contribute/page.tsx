import { Suspense } from 'react';

import ContributeClient from './ContributeClient';

export default function ContributePage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 font-mono text-sm text-muted">Loading…</div>}>
      <ContributeClient />
    </Suspense>
  );
}
