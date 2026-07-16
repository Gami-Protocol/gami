import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function SdkPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="SDK Reference"
      description="Ship verified engagement events into the Gami rewards layer without building custom loyalty infrastructure."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Integration surface</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-mono text-gami-accent">identify()</span> — bind a user to a Gami universal
            identity.
          </li>
          <li>
            <span className="font-mono text-gami-accent">track()</span> — emit quests, purchases, referrals, and
            custom partner actions.
          </li>
          <li>
            <span className="font-mono text-gami-accent">claim()</span> — surface claimable XP and token rewards
            after settlement.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Pipeline</h2>
        <p className="rounded border border-gami-purple/30 bg-gami-purple/10 p-4 font-mono text-xs text-gami-accent">
          SDK → Event Bus → AI Orchestration → L2 Ledger Anchor
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/developers/docs"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Documentation
        </Link>
        <Link
          to="/developers/api"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Get API Keys
        </Link>
      </div>
    </SiteContentPage>
  );
}
