import { type ReactNode } from 'react';
import { Text } from 'react-native';

import { cn } from '@/lib/utils';

type AccentColor = 'magenta' | 'purple' | 'green' | 'cyan' | 'yellow';

const accentClass: Record<AccentColor, string> = {
  magenta: 'text-magenta',
  purple: 'text-purple-lo',
  green: 'text-green',
  cyan: 'text-cyan',
  yellow: 'text-yellow',
};

interface GHeadingProps {
  children: ReactNode;
  className?: string;
  size?: 'lg' | 'xl' | '2xl';
}

const sizeClass = {
  lg: 'text-[28px] leading-[32px]',
  xl: 'text-[34px] leading-[38px]',
  '2xl': 'text-[40px] leading-[44px]',
};

/** Display heading. Use <GHeading.Accent> spans for one colored word. */
export function GHeading({ children, className, size = 'xl' }: GHeadingProps) {
  return (
    <Text
      className={cn('font-display text-ink font-bold tracking-tight', sizeClass[size], className)}
      style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
    >
      {children}
    </Text>
  );
}

/** Inline accent word inside a GHeading. */
export function Accent({
  children,
  color = 'magenta',
}: {
  children: ReactNode;
  color?: AccentColor;
}) {
  return <Text className={cn('font-display font-bold', accentClass[color])}>{children}</Text>;
}

GHeading.Accent = Accent;

export function GBody({
  children,
  className,
  color = 'dim',
}: {
  children: ReactNode;
  className?: string;
  color?: 'ink' | 'dim' | 'mute';
}) {
  const c = color === 'ink' ? 'text-ink' : color === 'mute' ? 'text-ink-mute' : 'text-ink-dim';
  return (
    <Text className={cn('font-body text-[15px] leading-[21px]', c, className)}>{children}</Text>
  );
}

/** Monospace label for numerics, addresses, handles. */
export function GMono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text
      className={cn('text-ink font-mono', className)}
      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
    >
      {children}
    </Text>
  );
}
