'use client';

import { motion } from 'framer-motion';

const FLOW = ['User', 'SDK', 'MCP', 'AI Agents', 'Reward Engine', 'Blockchain', 'Wallet'];

const CAPABILITIES = [
  'AI Agents',
  'MCP',
  'Reward Engine',
  'Adaptive Quests',
  'Personalization',
  'Fraud Detection',
  'Risk Engine',
];

export function AiSection() {
  return (
    <section id="ai" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">AI</p>
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
          Intelligent rewards infrastructure
        </h2>
        <p className="mt-4 text-zinc-400">
          Agents, MCP, and a reward engine that adapts quests, personalizes incentives, and detects
          abuse in real time.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        {CAPABILITIES.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/8 bg-card/70 p-6">
        <div className="flex min-w-[720px] items-center justify-between gap-3">
          {FLOW.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium"
              >
                {step}
              </motion.div>
              {index < FLOW.length - 1 ? (
                <span className="text-zinc-600" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
