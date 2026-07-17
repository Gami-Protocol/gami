'use client';

import { Trophy, Zap } from 'lucide-react';

import { QuestProfileCard } from '@/components/agentic-quest/QuestProfileCard';
import { QuestTrackerSkeleton } from '@/components/agentic-quest/QuestTrackerSkeleton';
import { SbtBadgeGrid } from '@/components/agentic-quest/SbtBadgeGrid';
import { XpProgressBar } from '@/components/agentic-quest/XpProgressBar';
import { useQuestChatStore } from '@/lib/stores/quest-chat-store';

export function QuestTrackerPane() {
  const questProfiles = useQuestChatStore((s) => s.questProfiles);
  const totalXp = useQuestChatStore((s) => s.totalXp);
  const level = useQuestChatStore((s) => s.level);
  const xpProgress = useQuestChatStore((s) => s.xpProgress);
  const unlockedBadges = useQuestChatStore((s) => s.unlockedBadges);
  const sessionId = useQuestChatStore((s) => s.sessionId);
  const milestone = useQuestChatStore((s) => s.milestone);

  const booting = sessionId === 'pending';

  return (
    <aside className="flex h-full flex-col border-l border-infinity-hairline bg-infinity-surface/50 md:sticky md:top-0 md:max-h-dvh">
      <header className="border-b border-infinity-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-infinity-violet-glow" />
          <h2 className="font-display text-lg font-bold text-infinity-ink">Quest Tracker</h2>
        </div>
        <p className="font-mono text-[10px] text-infinity-ink-mute">Live soulbound progression</p>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {booting ? (
          <QuestTrackerSkeleton />
        ) : (
          <>
            <section className="infinity-panel infinity-glow p-4">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-infinity-violet-glow" />
                <span className="font-mono text-xs uppercase tracking-widest text-infinity-ink-dim">
                  Status Score
                </span>
              </div>
              <XpProgressBar
                totalXp={totalXp}
                level={level}
                progress={xpProgress}
                xpGained={milestone?.xpGained}
              />
            </section>

            <section>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-infinity-ink-dim">
                Soulbound Badges
              </h3>
              <SbtBadgeGrid unlockedIds={unlockedBadges} />
            </section>

            <section>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-infinity-ink-dim">
                Active Quests ({questProfiles.length})
              </h3>
              {questProfiles.length === 0 ? (
                <p className="rounded-xl border border-dashed border-infinity-hairline p-4 text-center text-sm text-infinity-ink-mute">
                  No quests yet. Start a campaign in chat.
                </p>
              ) : (
                <div className="space-y-3">
                  {questProfiles.map((q, i) => (
                    <QuestProfileCard key={q.id} quest={q} index={i} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
