import { Link, Outlet } from 'react-router-dom';

export function LegalLayout() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Outlet />
      <footer className="mt-12 border-t border-white/10 pt-6 font-mono text-xs text-muted">
        <Link to="/legal/terms" className="mr-4 hover:text-white">
          Terms
        </Link>
        <Link to="/legal/privacy" className="mr-4 hover:text-white">
          Privacy
        </Link>
        <Link to="/legal/risk" className="hover:text-white">
          Risk Disclosure
        </Link>
      </footer>
    </div>
  );
}
