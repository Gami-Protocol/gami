import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface GCardProps {
  children: ReactNode;
  className?: string;
  /** Render with a gradient fill instead of flat surface. */
  gradient?: boolean;
  /** Custom gradient colors. */
  colors?: readonly [string, string, ...string[]];
  onPress?: () => void;
  /** Add a colored glow border. */
  glow?: boolean;
}

export function GCard({ children, className, gradient, colors, onPress, glow }: GCardProps) {
  const inner = (
    <View
      className={cn(
        'rounded-[20px] p-4',
        !gradient && 'border-hairline bg-surface border',
        className,
      )}
    >
      {children}
    </View>
  );

  const body = gradient ? (
    <LinearGradient
      colors={colors ?? ['#6E3CFB', '#B14BFF', '#FF3D8B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { borderRadius: 20 },
        glow
          ? {
              shadowColor: '#6E3CFB',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 24,
              elevation: 10,
            }
          : null,
      ]}
    >
      <View className={cn('rounded-[20px] p-4', className)}>{children}</View>
    </LinearGradient>
  ) : (
    inner
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          haptics.light();
          onPress();
        }}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}
