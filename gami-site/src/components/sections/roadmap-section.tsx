'use client';

import { motion } from 'framer-motion';

const MILESTONES = [
  'Wallet',
  'SDK',
  'AI',
  'Partners',
  'Marketplace',
  'L2',
  'Governance',
  'Enterprise',
  'Global Launch',
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Roadmap
        </p>
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
          From wallet to global launch
        </h2>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-primary via-secondary to-transparent md:left-1/2" />
        <div className="space-y-8">
          {MILESTONES.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className={`relative flex ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}
            >
              <div className="ml-10 w-full rounded-3xl border border-white/8 bg-card p-5 md:ml-0 md:w-[calc(50%-2rem)]">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Phase {index + 1}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-semibold">
                  {item}
                </h3>
              </div>
              <span className="absolute left-[0.7rem] top-6 h-3 w-3 rounded-full bg-primary shadow-[0_0_20px_rgba(108,59,255,0.8)] md:left-1/2 md:-translate-x-1/2" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
