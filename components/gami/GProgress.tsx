import { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/lib/utils';

const AView = createAnimatedComponent(View);

/** Continuous gradient progress bar (0..1). */
export function GProgressBar({ value, className }: { value: number; className?: string }) {
  const w = useSharedValue(value);
  useEffect(() => {
    w.value = withTiming(Math.min(1, Math.max(0, value)), { duration: 500 });
  }, [value, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View className={cn('bg-surface-2 h-2 overflow-hidden rounded-full', className)}>
      <AView style={style} className="h-full">
        <LinearGradient
          colors={['#6E3CFB', '#FF3D8B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: 999 }}
        />
      </AView>
    </View>
  );
}

/** Segmented step dots like the onboarding top bar. */
export function GStepDots({ n, active }: { n: number; active: number }) {
  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <View
          // eslint-disable-next-line react/no-array-index-key -- static step-count array; dots have no stable identity beyond position
          key={i}
          className={cn('h-1.5 flex-1 rounded-full', i < active ? 'bg-purple-lo' : 'bg-surface-2')}
        />
      ))}
    </View>
  );
}
