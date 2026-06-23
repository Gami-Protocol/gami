import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const AnimatedPressable = createAnimatedComponent(Pressable);

interface PrimaryProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  /** A small sticker badge shown top-right (e.g. "+50 XP"). */
  badge?: ReactNode;
  icon?: ReactNode;
}

/** Gradient-filled primary CTA with press-scale + optional sticker badge. */
export function GButtonPrimary({ label, onPress, disabled, className, badge, icon }: PrimaryProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View className={cn('relative', className)}>
      {badge}
      <AnimatedPressable
        style={style}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 18, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 300 });
        }}
        onPress={() => {
          if (disabled) return;
          haptics.medium();
          onPress?.();
        }}
      >
        <LinearGradient
          colors={disabled ? ['#3a3550', '#2a2738'] : ['#6E3CFB', '#B14BFF', '#FF3D8B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16 }}
        >
          <View className="h-14 flex-row items-center justify-center gap-2 px-6">
            {icon}
            <Text
              className={cn(
                'font-display text-[16px] font-bold tracking-wide',
                disabled ? 'text-ink-mute' : 'text-white',
              )}
              style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              {label}
            </Text>
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
}

interface GhostProps {
  label: string;
  sublabel?: string;
  onPress?: () => void;
  className?: string;
  icon?: ReactNode;
  destructive?: boolean;
}

/** 1px hairline transparent button / card. */
export function GButtonGhost({
  label,
  sublabel,
  onPress,
  className,
  icon,
  destructive,
}: GhostProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={style}
      className={cn(
        'rounded-2xl border px-5 py-4',
        destructive ? 'border-danger/60' : 'border-hairline',
        className,
      )}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 300 });
      }}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
    >
      <View className="flex-row items-center justify-center gap-2">
        {icon}
        <Text
          className={cn(
            'font-display text-[15px] font-semibold',
            destructive ? 'text-danger' : 'text-ink',
          )}
          style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
        >
          {label}
        </Text>
      </View>
      {sublabel ? (
        <Text className="text-ink-mute mt-0.5 text-center font-mono text-[11px]">{sublabel}</Text>
      ) : null}
    </AnimatedPressable>
  );
}
