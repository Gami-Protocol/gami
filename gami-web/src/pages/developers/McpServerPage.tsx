import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function McpServerPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="MCP Server"
      description="Partner credentials authenticate MCP client connections to the Gami agentic quest server and rewards infrastructure."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Request access</h2>
        <p className="leading-relaxed">
          MCP server partner-key provisioning opens with the agentic tooling launch. Join the waitlist or email
          the team to be notified when developer credentials are available.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Credential types</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-display font-bold text-white">Publishable</span> — browser MCP clients and
            public tool calls.
          </li>
          <li>
            <span className="font-display font-bold text-white">Secret</span> — server-side MCP agents, event
            verification, and settlement webhooks.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Endpoint</h2>
        <p className="rounded border border-gami-purple/30 bg-gami-purple/10 p-4 font-mono text-xs text-gami-accent">
          Streamable HTTP · /api/mcp · x-partner-key or Authorization: Bearer
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/waitlist"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Join Waitlist
        </Link>
        <a
          href="mailto:admin@gamiprotocol.io?subject=Gami%20MCP%20Server%20Access"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Contact Partners
        </a>
      </div>
    </SiteContentPage>
  );
}
