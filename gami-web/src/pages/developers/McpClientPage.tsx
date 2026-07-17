import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

export function McpClientPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="MCP Client"
      description="Connect agentic tooling to Gami through an MCP client — emit verified engagement events without building custom loyalty infrastructure."
    >
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Integration surface</h2>
        <ul className="space-y-3">
          <li>
            <span className="font-mono text-gami-accent">agentic_quest_chat</span> — orchestrate quests
            through natural-language agent turns.
          </li>
          <li>
            <span className="font-mono text-gami-accent">create_quest</span> /{' '}
            <span className="font-mono text-gami-accent">verify_quest_progress</span> — forge campaigns and
            settle milestones via MCP tools.
          </li>
          <li>
            <span className="font-mono text-gami-accent">get_quest_status</span> — read XP, level, and active
            quest profiles for the session.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-white">Pipeline</h2>
        <p className="rounded border border-gami-purple/30 bg-gami-purple/10 p-4 font-mono text-xs text-gami-accent">
          MCP Client → MCP Server → AI Orchestration → L2 Ledger Anchor
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
          to="/developers/mcp-server"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          MCP Server Access
        </Link>
      </div>
    </SiteContentPage>
  );
}
