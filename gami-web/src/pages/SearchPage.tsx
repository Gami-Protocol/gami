import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { KEY_PAGES } from '@/content/discovery';

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();

  const results = useMemo(() => {
    if (!q) return [...KEY_PAGES];
    const needle = q.toLowerCase();
    return KEY_PAGES.filter(
      (page) =>
        page.title.toLowerCase().includes(needle) ||
        page.summary.toLowerCase().includes(needle) ||
        page.path.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">Search Gami Protocol</h1>
      <p className="mb-8 text-gray-400">
        Find docs, wallet guides, tokenomics, and other public pages on gamiprotocol.io.
      </p>

      <form
        className="mb-10"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const next = String(form.get('q') ?? '').trim();
          setParams(next ? { q: next } : {});
        }}
      >
        <label className="sr-only" htmlFor="site-search">
          Search
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="site-search"
            name="q"
            defaultValue={q}
            placeholder="Search pages…"
            className="w-full border-2 border-white/20 bg-black/40 px-4 py-3 text-white outline-none focus:border-gami-purple"
          />
          <button
            type="submit"
            className="gami-gradient neo-border px-6 py-3 font-display font-bold uppercase tracking-wider"
          >
            Search
          </button>
        </div>
      </form>

      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-gray-500">
        {q ? `${results.length} result${results.length === 1 ? '' : 's'} for “${q}”` : 'All public pages'}
      </p>

      <ul className="space-y-4">
        {results.map((page) => (
          <li key={page.path} className="border-b border-white/10 pb-4">
            <Link to={page.path} className="font-display text-xl font-semibold text-white hover:text-gami-accent">
              {page.title}
            </Link>
            <p className="mt-1 text-sm text-gray-400">{page.summary}</p>
            <p className="mt-1 font-mono text-xs text-gami-purple">{page.path === '/' ? '/' : page.path}</p>
          </li>
        ))}
      </ul>

      {results.length === 0 ? (
        <p className="text-gray-400">
          No matches. Try “wallet”, “docs”, or “waitlist”, or{' '}
          <Link to="/developers/docs" className="text-gami-accent underline">
            open developer docs
          </Link>
          .
        </p>
      ) : null}
    </section>
  );
}
