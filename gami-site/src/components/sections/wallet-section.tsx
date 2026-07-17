'use client';

import { motion } from 'framer-motion';
import { ButtonLink } from '@/components/ui/button';

const FEATURES = [
  'Universal Rewards',
  'Cross-chain',
  'AI Rewards',
  'Staking',
  'Identity',
  'Secure Wallet',
  'Notifications',
];

export function WalletSection() {
  return (
    <section id="wallet" className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
            Wallet
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
            One wallet for XP, rewards, and chains
          </h2>
          <p className="mt-4 max-w-md text-zinc-400">
            Track quests, badges, leaderboards, staking, NFTs, and cross-chain assets in a single
            beautiful mobile experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/wallet" size="lg">
              Download on App Store
            </ButtonLink>
            <ButtonLink href="/wallet" variant="secondary" size="lg">
              Get it on Google Play
            </ButtonLink>
            <ButtonLink href="/waitlist" variant="ghost" size="lg">
              Join Beta
            </ButtonLink>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {FEATURES.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(108,59,255,0.35),transparent_65%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="mb-5 flex items-center justify-between text-xs text-zinc-500">
              <span>Gami Wallet</span>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300">
                Live
              </span>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary/40 via-secondary/20 to-accent/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Total XP</p>
              <p className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-bold">128,450</p>
              <p className="mt-1 text-sm text-white/70">+2,400 this week</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['Rewards', '$184.20'],
                ['Staked', '12,000'],
                ['Badges', '36'],
                ['Rank', '#248'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-black/30 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/8 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Quest feed</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                <li>Complete Base onboarding · +500 XP</li>
                <li>Refer a builder · +1,000 XP</li>
                <li>Stake $GAMI · multiplier x1.5</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
