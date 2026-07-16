import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function ApiKeysPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="API Keys"
      description="Partner API keys authenticate SDK calls and event submissions to the Gami rewards infrastructure."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Request access</h2>
        <p className="leading-relaxed">
          API key provisioning opens with the partner SDK launch. Join the waitlist or email the team to be
          notified when developer credentials are available.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Key types</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-display font-bold text-white">Publishable</span> — client-side identify and
            track calls.
          </li>
          <li>
            <span className="font-display font-bold text-white">Secret</span> — server-side event verification and
            settlement webhooks.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/waitlist"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Join Waitlist
        </Link>
        <a
          href="mailto:admin@gamiprotocol.io?subject=Gami%20API%20Key%20Access"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Contact Partners
        </a>
      </div>
    </SiteContentPage>
  );
}
