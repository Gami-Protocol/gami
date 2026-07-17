'use client';

import { motion } from 'framer-motion';

import { statsFromXP } from '@/lib/quest-math';

interface XpProgressBarProps {
  totalXp: number;
  level: number;
  progress: number;
  xpGained?: number;
}

export function XpProgressBar({ totalXp, level, progress, xpGained }: XpProgressBarProps) {
  const stats = statsFromXP(totalXp);

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-display font-bold text-infinity-ink">
          Level {level}
        </span>
        <span className="font-mono text-xs text-infinity-ink-dim">
          {stats.totalXP} XP · {stats.xpToNextLevel} to next
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-infinity-surface-2">
        <motion.div
          className="absolute inset-y-0 left-0 infinity-gradient rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      {xpGained ? (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: -20 }}
          exit={{ opacity: 0 }}
          className="absolute -top-1 right-0 font-mono text-xs font-bold text-infinity-green"
        >
          +{xpGained} XP
        </motion.span>
      ) : null}
    </div>
  );
}
