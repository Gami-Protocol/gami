'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ButtonLink } from '@/components/ui/button';

const HeroCanvas = dynamic(() => import('@/components/hero-canvas').then((m) => m.HeroCanvas), {
  ssr: false,
  loading: () => <div className="absolute inset-0 gami-glow opacity-60" />,
});

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 gami-grid opacity-40" />
        <div className="absolute left-1/2 top-[-10%] h-[70vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(108,59,255,0.35),transparent_60%)] blur-2xl" />
        <div className="absolute bottom-0 right-[-10%] h-[50vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(63,169,255,0.2),transparent_60%)] blur-3xl" />
        <HeroCanvas />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-start px-5 pb-24 pt-10 md:px-8 md:pt-20">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Protocol live on testnet
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="max-w-4xl font-[family-name:var(--font-syne)] text-5xl font-bold leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl"
        >
          The Universal{' '}
          <span className="text-gradient">AI Gamification</span> Layer
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-300 md:text-xl"
        >
          Reward every interaction. Across apps. Across chains. Across AI. Across the internet.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-500 md:text-base"
        >
          Gami Protocol is the infrastructure powering intelligent rewards, quests, loyalty,
          reputation and engagement for modern applications.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <ButtonLink href="/wallet" size="lg">
            Download Wallet
          </ButtonLink>
          <ButtonLink href="/waitlist" variant="secondary" size="lg">
            Join Waitlist
          </ButtonLink>
        </motion.div>
      </div>
    </section>
  );
}
