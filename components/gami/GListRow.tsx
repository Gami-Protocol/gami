import { ChevronRight } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface GListRowProps {
  icon?: ReactNode;
  title: string;
  meta?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  /** Highlight (purple border + glow) — used for the live actionable row. */
  highlight?: boolean;
  badge?: ReactNode;
  className?: string;
}

export function GListRow({
  icon,
  title,
  meta,
  chevron,
  onPress,
  highlight,
  badge,
  className,
}: GListRowProps) {
  const content = (
    <View
      className={cn(
        'bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3.5',
        highlight ? 'border-purple' : 'border-hairline',
        className,
      )}
    >
      {icon ? <View className="h-8 w-8 items-center justify-center">{icon}</View> : null}
      <Text
        className="font-body text-ink flex-1 text-[15px] font-medium"
        style={{ fontFamily: 'Inter_500Medium' }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {badge}
      {typeof meta === 'string' ? (
        <Text className="text-ink-dim font-mono text-[13px]">{meta}</Text>
      ) : (
        meta
      )}
      {chevron ? <ChevronRight size={18} color="#6B6880" /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          haptics.light();
          onPress();
        }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}
