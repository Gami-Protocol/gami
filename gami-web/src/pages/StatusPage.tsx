import { Link } from 'react-router-dom';

import { SiteContentPage } from '@/components/gami/SiteContentPage';

const SYSTEMS = [
  { name: 'Protocol API', status: 'Operational' },
  { name: 'Event Bus', status: 'Operational' },
  { name: 'Base L2 Settlement', status: 'Operational' },
  { name: 'Gami Wallet', status: 'Operational' },
  { name: 'Token Sale Portal', status: 'Operational' },
];

export function StatusPage() {
  return (
    <SiteContentPage
      eyebrow="Developers"
      title="System Status"
      description="Live health of Gami Protocol services. All systems reporting normal operation."
    >
      <div className="space-y-3">
        {SYSTEMS.map((system) => (
          <div
            key={system.name}
            className="flex items-center justify-between border border-white/10 bg-black/40 px-4 py-4"
          >
            <span className="font-display font-bold text-white">{system.name}</span>
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
              {system.status}
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
        Build 0.8.2-stable · Network live
      </p>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link
          to="/developers/docs"
          className="border-2 border-white px-6 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black"
        >
          Documentation
        </Link>
        <Link
          to="/wallet"
          className="gami-gradient neo-border px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white"
        >
          Launch App
        </Link>
      </div>
    </SiteContentPage>
  );
}
