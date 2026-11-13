import { useState } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { XpBar } from '@/components/XpBar';
import { Leaderboard } from '@/components/Leaderboard';
import { loadXpState, saveXpState, xpForMessage, todayKey } from '@/lib/xp';

export default function App() {
  const [xpState, setXpState] = useState(loadXpState);

  function handleEarnXp(text: string): number {
    const gain = xpForMessage(text);
    const today = todayKey();
    setXpState((prev) => {
      const next = {
        totalXp: prev.totalXp + gain,
        messageCount: prev.messageCount + 1,
        streakDays: prev.lastActiveDay === today ? prev.streakDays : prev.streakDays + 1,
        lastActiveDay: today,
      };
      saveXpState(next);
      return next;
    });
    return gain;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gami-purple font-display text-sm font-bold">
            N
          </div>
          <span className="font-display text-lg font-semibold">
            Nova <span className="text-muted">by Gami</span>
          </span>
        </div>
        <span className="hidden text-xs text-muted sm:block">
          {xpState.messageCount} chats · {xpState.streakDays} day streak
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 md:flex-row">
        <section className="flex min-h-[70vh] flex-1 flex-col gap-3">
          <XpBar totalXp={xpState.totalXp} />
          <div className="flex-1">
            <ChatPanel onEarnXp={handleEarnXp} />
          </div>
        </section>
        <aside className="w-full shrink-0 md:w-72">
          <Leaderboard yourXp={xpState.totalXp} />
        </aside>
      </main>

      <footer className="px-6 py-3 text-center text-[11px] text-muted">
        Nova is a chat-only companion. XP and rankings are illustrative and carry no cash or token value.
      </footer>
    </div>
  );
}
