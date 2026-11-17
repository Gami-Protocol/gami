import { useEffect, useState } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { XpBar } from '@/components/XpBar';
import { Leaderboard } from '@/components/Leaderboard';
import { loadXpState, saveXpState, xpForMessage, todayKey, nextStreakDays } from '@/lib/xp';

export default function App() {
  const [xpState, setXpState] = useState(loadXpState);

  // Other same-origin tabs can save XP too; pick up their writes so this tab
  // doesn't render (or later overwrite) a stale total.
  useEffect(() => {
    function onStorage() {
      setXpState(loadXpState());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function handleEarnXp(text: string): number {
    const gain = xpForMessage(text);
    const today = todayKey();
    // Merge onto the latest persisted state, not just this tab's in-memory
    // copy, to narrow the window where a second tab's write gets clobbered.
    const latest = loadXpState();
    const next = {
      totalXp: latest.totalXp + gain,
      messageCount: latest.messageCount + 1,
      streakDays: nextStreakDays(latest.streakDays, latest.lastActiveDay, today),
      lastActiveDay: today,
    };
    saveXpState(next);
    setXpState(next);
    return gain;
  }

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-white">
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

      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 p-4 md:flex-row">
        <section className="flex min-h-[70vh] flex-1 flex-col gap-3">
          <XpBar totalXp={xpState.totalXp} />
          <div className="min-h-0 flex-1">
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
