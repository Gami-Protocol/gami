import type { ReactNode } from 'react';

import { GamiFooter } from '@/components/gami/GamiFooter';

export function SiteContentPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-36">
        {eyebrow ? (
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-gami-accent">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{title}</h1>
        {description ? <p className="mt-4 text-lg leading-relaxed text-gray-400">{description}</p> : null}
        <div className="mt-12 space-y-8 text-muted">{children}</div>
      </div>
      <GamiFooter />
    </>
  );
}
