import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

/**
 * Spring-stagger entrance. Returns an animated style that fades + rises in.
 * @param index position in the stagger sequence (0-based)
 * @param step ms between items
 */
export function useStaggerIn(index = 0, step = 60) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * step,
      withSpring(1, { damping: 14, stiffness: 140, mass: 0.7 }),
    );
  }, [index, step, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 18 }],
  }));
}

/** Sticker pop entrance: scale 0.6→1 + slight rotate. */
export function useStickerPop(index = 0, step = 60, tilt = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * step,
      withSpring(1, { damping: 11, stiffness: 160, mass: 0.6 }),
    );
  }, [index, step, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }, { rotate: `${tilt * progress.value}deg` }],
  }));
}
