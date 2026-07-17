'use client';

import { motion } from 'framer-motion';
import { ButtonLink } from '@/components/ui/button';

const PARTNERS = [
  {
    title: 'Gaming',
    body: 'Ship quests, seasons, and loyalty loops without rebuilding reward infra.',
  },
  {
    title: 'Retail & E-commerce',
    body: 'Turn purchases and referrals into portable XP with analytics built in.',
  },
  {
    title: 'AI',
    body: 'Reward agent actions and verified outcomes through MCP-native hooks.',
  },
  {
    title: 'Fintech',
    body: 'Layer engagement on top of payments, savings, and onboarding flows.',
  },
  {
    title: 'Enterprise',
    body: 'Launch internal or customer gamification with dashboards and controls.',
  },
  {
    title: 'Creator & Education',
    body: 'Incentivize completion, community, and retention with universal identity.',
  },
];

export function PartnersSection() {
  return (
    <section id="partners" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Partners
        </p>
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
          Built for every engagement surface
        </h2>
        <p className="mt-4 text-zinc-400">
          SDK, dashboard, analytics, rewards, and API — one stack for gaming, retail, AI, fintech,
          enterprise, and creators.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((partner, index) => (
          <motion.div
            key={partner.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="rounded-3xl border border-white/8 bg-card/80 p-6 transition hover:border-primary/40"
          >
            <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              {partner.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{partner.body}</p>
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-zinc-500">
              SDK · Dashboard · Analytics · Rewards · API
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <ButtonLink href="/partners" size="lg">
          Become a Partner
        </ButtonLink>
      </div>
    </section>
  );
}
