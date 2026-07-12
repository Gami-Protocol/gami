'use client';

import { useEffect } from 'react';
import { Bot, Shield } from 'lucide-react';

import { ChatPane } from '@/components/agentic-quest/ChatPane';
import { MilestoneModal } from '@/components/agentic-quest/MilestoneModal';
import { QuestToast } from '@/components/agentic-quest/QuestToast';
import { QuestTrackerPane } from '@/components/agentic-quest/QuestTrackerPane';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuestChatStore } from '@/lib/stores/quest-chat-store';

export function AgenticQuestShell() {
  const initSession = useQuestChatStore((s) => s.initSession);

  useEffect(() => {
    initSession();
  }, [initSession]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-infinity-hairline px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl infinity-gradient">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold infinity-gradient-text">
              Gami Agentic Quest
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-infinity-ink-mute">
              Quest Generation · Supervisor · Security
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-infinity-violet/30 px-3 py-1 md:flex">
          <Shield className="h-3.5 w-3.5 text-infinity-green" />
          <span className="font-mono text-[10px] text-infinity-ink-dim">Agent Layer Secured</span>
        </div>
      </header>

      {/* Desktop split view */}
      <div className="hidden flex-1 md:grid md:grid-cols-[1fr_380px]">
        <section className="min-h-0 border-r border-infinity-hairline">
          <ChatPane />
        </section>
        <QuestTrackerPane />
      </div>

      {/* Mobile tabbed view */}
      <div className="flex-1 md:hidden">
        <Tabs defaultValue="chat" className="flex h-full flex-col px-4 pb-4">
          <TabsList className="mt-4 w-full">
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex-1">
              Quests
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden rounded-xl border border-infinity-hairline">
            <ChatPane />
          </TabsContent>
          <TabsContent value="quests" className="flex-1 overflow-hidden rounded-xl border border-infinity-hairline">
            <QuestTrackerPane />
          </TabsContent>
        </Tabs>
      </div>

      <QuestToast />
      <MilestoneModal />
    </div>
  );
}
