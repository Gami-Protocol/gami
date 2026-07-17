'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuestChatStore } from '@/lib/stores/quest-chat-store';

const PARTICLES = Array.from({ length: 12 }, (_, i) => i);

export function MilestoneModal() {
  const milestone = useQuestChatStore((s) => s.milestone);
  const dismissMilestone = useQuestChatStore((s) => s.dismissMilestone);

  const showModal =
    milestone?.type === 'level_up' || milestone?.type === 'quest_completed';

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && dismissMilestone()}>
      <DialogContent className="overflow-hidden">
        <AnimatePresence>
          {showModal && milestone && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {PARTICLES.map((p) => (
                <motion.span
                  key={p}
                  className="pointer-events-none absolute h-2 w-2 rounded-full infinity-gradient"
                  style={{ left: '50%', top: '40%' }}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    scale: 0,
                  }}
                  transition={{ duration: 0.8, delay: p * 0.03 }}
                />
              ))}

              <DialogHeader>
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full infinity-gradient">
                  {milestone.type === 'level_up' ? (
                    <Sparkles className="h-7 w-7 text-white" />
                  ) : (
                    <Trophy className="h-7 w-7 text-white" />
                  )}
                </div>
                <DialogTitle>{milestone.title}</DialogTitle>
                <DialogDescription className="text-base text-infinity-ink">
                  {milestone.subtitle}
                  {milestone.xpGained ? (
                    <span className="mt-2 block font-mono text-infinity-green">
                      +{milestone.xpGained} soulbound XP
                    </span>
                  ) : null}
                </DialogDescription>
              </DialogHeader>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
