import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { cn } from '@/lib/utils';
import { useStickerPop } from './useStaggerIn';

type StickerColor = 'magenta' | 'green' | 'yellow' | 'cyan' | 'purple';

const bg: Record<StickerColor, string> = {
  magenta: 'bg-magenta',
  green: 'bg-green',
  yellow: 'bg-yellow',
  cyan: 'bg-cyan',
  purple: 'bg-purple',
};

const fg: Record<StickerColor, string> = {
  magenta: 'text-white',
  green: 'text-bg',
  yellow: 'text-bg',
  cyan: 'text-bg',
  purple: 'text-white',
};

interface GStickerProps {
  children: ReactNode;
  color?: StickerColor;
  /** degrees of tilt */
  tilt?: number;
  className?: string;
  index?: number;
}

/** Rotated "sticker" tag/badge with a hard-offset shadow pop. */
export function GSticker({
  children,
  color = 'magenta',
  tilt = -4,
  className,
  index = 0,
}: GStickerProps) {
  const pop = useStickerPop(index, 60, tilt);
  return (
    <Animated.View style={pop} className={className}>
      <View
        className={cn('self-start rounded-md px-2.5 py-1', bg[color])}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.55,
          shadowRadius: 0,
          elevation: 6,
        }}
      >
        {typeof children === 'string' ? (
          <Text
            className={cn('font-mono text-[11px] font-bold tracking-wider', fg[color])}
            style={{ fontFamily: 'JetBrainsMono_700Bold' }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Animated.View>
  );
}
