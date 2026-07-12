'use client';

import { useEffect, useRef } from 'react';

import { ChatBubble } from '@/components/agentic-quest/ChatBubble';
import { ChatInput } from '@/components/agentic-quest/ChatInput';
import { ChatSkeleton } from '@/components/agentic-quest/ChatSkeleton';
import { ErrorBoundary } from '@/components/agentic-quest/ErrorBoundary';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuestChatStore } from '@/lib/stores/quest-chat-store';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatPane() {
  const messages = useQuestChatStore((s) => s.messages);
  const isLoading = useQuestChatStore((s) => s.isLoading);
  const error = useQuestChatStore((s) => s.error);
  const sendMessage = useQuestChatStore((s) => s.sendMessage);
  const clearError = useQuestChatStore((s) => s.clearError);
  const initSession = useQuestChatStore((s) => s.initSession);
  const sessionId = useQuestChatStore((s) => s.sessionId);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const booting = sessionId === 'pending';

  return (
    <div className="flex h-full min-h-[60dvh] flex-col md:min-h-0">
      <header className="border-b border-infinity-hairline px-4 py-3">
        <h2 className="font-display text-lg font-bold infinity-gradient-text">Agentic Terminal</h2>
        <p className="font-mono text-[10px] text-infinity-ink-mute">Session · {sessionId}</p>
      </header>

      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-infinity-magenta/40 bg-infinity-magenta/10 px-3 py-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-infinity-magenta" />
          <span className="flex-1 text-infinity-ink-dim">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 px-4 py-4">
        <ErrorBoundary>
          {booting ? (
            <ChatSkeleton />
          ) : (
            <>
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </ErrorBoundary>
      </ScrollArea>

      <ChatInput onSend={sendMessage} disabled={isLoading || booting} />
    </div>
  );
}
