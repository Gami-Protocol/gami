import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const AnimatedView = Animated.View;

interface GChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Tilt applied when selected (sticker feel). */
  tilt?: number;
  className?: string;
}

/** Pill chip. Gets gradient fill + sticker shadow + tilt when selected. */
export function GChip({ label, selected, onPress, tilt = -3, className }: GChipProps) {
  const rot = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const handle = () => {
    haptics.selection();
    rot.value = withSpring(selected ? 0 : tilt, { damping: 10, stiffness: 180 });
    onPress?.();
  };

  return (
    <AnimatedView style={style} className={className}>
      <Pressable onPress={handle}>
        {selected ? (
          <LinearGradient
            colors={['#6E3CFB', '#B14BFF', '#FF3D8B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.55,
              shadowRadius: 0,
              elevation: 6,
            }}
          >
            <View className="px-4 py-2">
              <Text
                className="font-mono text-[13px] font-bold tracking-wide text-white"
                style={{ fontFamily: 'JetBrainsMono_700Bold' }}
              >
                {label}
              </Text>
            </View>
          </LinearGradient>
        ) : (
          <View className={cn('border-hairline bg-surface rounded-full border px-4 py-2')}>
            <Text
              className="text-ink-dim font-mono text-[13px] font-medium tracking-wide"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </AnimatedView>
  );
}
