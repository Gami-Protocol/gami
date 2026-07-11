import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-32 text-center">
      <h1 className="font-display text-6xl font-bold text-gami-purple">404</h1>
      <p className="mt-4 text-muted">Page not found.</p>
      <Link to="/" className="mt-8 inline-block font-display font-bold uppercase text-gami-accent hover:text-white">
        ← Back to Home
      </Link>
    </div>
  );
}
