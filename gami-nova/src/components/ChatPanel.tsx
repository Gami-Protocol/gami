import { useEffect, useRef, useState } from 'react';
import { novaGreeting, novaReplyTo } from '@/lib/nova';

export interface ChatMessage {
  id: string;
  role: 'user' | 'nova';
  text: string;
  xpGain?: number;
}

export function ChatPanel({
  onEarnXp,
}: {
  onEarnXp: (text: string) => number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greet', role: 'nova', text: novaGreeting() },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const xpGain = onEarnXp(text);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, xpGain };
    const novaMsg: ChatMessage = { id: crypto.randomUUID(), role: 'nova', text: novaReplyTo(text) };
    setMessages((prev) => [...prev, userMsg, novaMsg]);
    setInput('');
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`relative max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-gami-purple text-white'
                  : 'bg-white/5 text-white/90 ring-1 ring-white/10'
              }`}
            >
              {m.text}
              {m.xpGain != null && (
                <span className="absolute -top-5 right-1 animate-xp-pop text-xs font-semibold text-nova-xp">
                  +{m.xpGain} XP
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="Talk to Nova…"
          className="flex-1 rounded-xl bg-background px-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gami-purple"
        />
        <button
          onClick={send}
          className="rounded-xl bg-gami-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-gami-dark"
        >
          Send
        </button>
      </div>
    </div>
  );
}
