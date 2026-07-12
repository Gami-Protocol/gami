'use client';

import { motion } from 'framer-motion';

import type { ChatMessage } from '@/lib/types/agentic-quest';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={cn('mb-3 flex max-w-[85%] flex-col', isUser ? 'ml-auto items-end' : 'mr-auto items-start')}
    >
      {!isUser && (
        <span className="mb-1 font-mono text-[10px] uppercase tracking-widest text-infinity-violet-glow">
          Gami Supervisor
        </span>
      )}
      <div
        className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'infinity-gradient text-white shadow-lg'
            : 'infinity-panel infinity-glow border-infinity-violet/30 text-infinity-ink',
        )}
      >
        {message.isStreaming && !message.content ? (
          <span className="inline-flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-infinity-violet-glow [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-infinity-violet-glow [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-infinity-violet-glow [animation-delay:300ms]" />
          </span>
        ) : (
          <span>{message.content}</span>
        )}
        {message.isStreaming && message.content ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-infinity-violet-glow" />
        ) : null}
      </div>
      {message.stateAction && message.stateAction !== 'NONE' && !message.isStreaming && (
        <span className="mt-1 font-mono text-[10px] text-infinity-green">
          Δ {message.stateAction}
        </span>
      )}
    </motion.div>
  );
}
