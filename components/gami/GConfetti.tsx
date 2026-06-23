import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#6E3CFB', '#B14BFF', '#FF3D8B', '#3DF5A0', '#FFD23D', '#3DD6F5'];
const COUNT = 40;
const { width } = Dimensions.get('window');

function Particle({ index }: { index: number }) {
  const p = useSharedValue(0);
  const startX = (index / COUNT) * width + (Math.random() * 40 - 20);
  const drift = Math.random() * 120 - 60;
  const size = 6 + Math.random() * 8;
  const color = COLORS[index % COLORS.length];
  const rotEnd = Math.random() * 720 - 360;
  const fall = 420 + Math.random() * 260;
  const delay = Math.random() * 250;

  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }));
  }, [p, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: drift * p.value },
      { translateY: fall * p.value },
      { rotate: `${rotEnd * p.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: size,
          height: size * 1.4,
          borderRadius: 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

/** Reward confetti burst. Mount when active; unmount to reset. */
export function GConfetti({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {Array.from({ length: COUNT }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- static fixed-count array; particles have no stable identity
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}
