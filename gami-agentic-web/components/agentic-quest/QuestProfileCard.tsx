'use client';

import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import type { QuestProfile } from '@/lib/types/agentic-quest';
import { cn } from '@/lib/utils';

interface QuestProfileCardProps {
  quest: QuestProfile;
  index?: number;
}

const STATUS_LABEL: Record<QuestProfile['status'], string> = {
  active: 'Active',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function QuestProfileCard({ quest, index = 0 }: QuestProfileCardProps) {
  const isComplete = quest.status === 'completed';

  return (
    <motion.article
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        'infinity-panel p-4 transition-shadow',
        !isComplete && 'infinity-glow',
        isComplete && 'border-infinity-green/30',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h4 className="font-display text-sm font-bold text-infinity-ink">{quest.title}</h4>
          <p className="font-mono text-[10px] uppercase tracking-wider text-infinity-ink-mute">
            {quest.category}
          </p>
        </div>
        <Badge variant={isComplete ? 'success' : 'default'}>{STATUS_LABEL[quest.status]}</Badge>
      </div>

      <div className="mb-2 flex justify-between text-xs text-infinity-ink-dim">
        <span>{quest.progress}%</span>
        <span>{quest.earnedXp || quest.xpReward} XP</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-infinity-surface-2">
        <motion.div
          className={cn('h-full rounded-full', isComplete ? 'bg-infinity-green' : 'infinity-gradient')}
          initial={{ width: 0 }}
          animate={{ width: `${quest.progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        />
      </div>
    </motion.article>
  );
}
