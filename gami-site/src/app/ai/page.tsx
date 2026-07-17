import type { Metadata } from 'next';
import { AiSection } from '@/components/sections/ai-section';
import { AiChat } from '@/components/chat/ai-chat';

export const metadata: Metadata = {
  title: 'AI',
  description: 'AI agents, MCP, adaptive quests, personalization, and reward intelligence.',
};

export default function AiPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">AI</p>
        <h1 className="max-w-3xl font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
          Ask Gami AI
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Adaptive quests, fraud detection, personalization, and MCP-connected agents for modern
          apps.
        </p>
      </div>
      <AiChat />
      <AiSection />
    </div>
  );
}
