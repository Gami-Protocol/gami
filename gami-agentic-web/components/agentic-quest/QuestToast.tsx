'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import { useQuestChatStore } from '@/lib/stores/quest-chat-store';

export function QuestToast() {
  const milestone = useQuestChatStore((s) => s.milestone);

  useEffect(() => {
    if (!milestone) return;

    if (milestone.type === 'quest_created') {
      toast.success('New Quest Forged', {
        description: milestone.subtitle,
      });
    } else if (milestone.type === 'quest_completed') {
      toast.success('Milestone Cleared', {
        description: milestone.xpGained
          ? `${milestone.subtitle} · +${milestone.xpGained} XP`
          : milestone.subtitle,
      });
    } else if (milestone.type === 'level_up') {
      toast('Level Up!', {
        description: milestone.subtitle,
        icon: '⚡',
      });
    }
  }, [milestone]);

  return null;
}
