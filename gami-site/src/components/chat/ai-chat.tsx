'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTIONS = [
  'How does Gami work?',
  'Explain tokenomics',
  'How do rewards work?',
  'Developer documentation',
  'Partner onboarding',
  'XP mechanics',
];

const QUICK_ACTIONS = [
  { href: '/developers', label: 'Build with Gami' },
  { href: '/developers#quests', label: 'Create Quest' },
  { href: '/wallet', label: 'Open Wallet' },
  { href: '/developers#docs', label: 'Read Docs' },
  { href: '/partners', label: 'Become Partner' },
];

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask me anything about Gami — wallet, SDK, rewards, token utility, partners, or roadmap.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    setError('');
    setInput('');
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: prompt,
    };
    const nextMessages = [...messages.filter((m) => m.id !== 'welcome'), userMessage];
    setMessages([...nextMessages, { id: `a-${Date.now()}`, role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Chat failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let assistant = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: assistant };
          }
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="ai-chat" className="relative mx-auto max-w-6xl px-5 py-24 md:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
            Live AI
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
            Ask Gami AI
          </h2>
          <p className="mt-3 max-w-xl text-zinc-400">
            The primary onboarding experience for the protocol — stream answers about product, SDK,
            token utility, and partners.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <ButtonLink key={action.href} href={action.href} variant="secondary" size="sm">
              {action.label}
            </ButtonLink>
          ))}
        </div>
      </div>

      <div className="glass overflow-hidden rounded-3xl shadow-[0_0_80px_rgba(108,59,255,0.12)]">
        <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4">
          <Sparkles className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium">Gami AI</span>
          {loading ? <Loader2 className="ml-auto h-4 w-4 animate-spin text-zinc-400" /> : null}
        </div>

        <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'ml-auto bg-primary/90 text-white'
                  : 'bg-white/5 text-zinc-200',
              )}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content || (loading ? '…' : '')}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 px-5 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 transition hover:border-secondary/50 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rewards, SDK, wallet, partners…"
              className="h-12 flex-1 rounded-full border border-white/10 bg-black/30 px-4 text-sm outline-none ring-primary/40 placeholder:text-zinc-600 focus:ring-2"
            />
            <Button type="submit" size="icon" disabled={!canSend} aria-label="Send">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
          {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
