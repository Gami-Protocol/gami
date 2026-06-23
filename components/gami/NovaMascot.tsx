import { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Mood = 'happy' | 'idle';

interface NovaMascotProps {
  size?: number;
  mood?: Mood;
  /** Disable the idle bob (e.g. small inline use). */
  still?: boolean;
}

/** Purple smiley mascot with idle bob + occasional blink + glow. */
export function NovaMascot({ size = 120, mood = 'idle', still }: NovaMascotProps) {
  const bob = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (still) return;
    bob.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600 }),
        withTiming(0.1, { duration: 90 }),
        withTiming(1, { duration: 90 }),
      ),
      -1,
      false,
    );
  }, [bob, blink, still]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 8 }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const eyeSize = size * 0.1;
  const mouthW = size * 0.26;

  return (
    <Animated.View style={bobStyle}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: '#6E3CFB',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: size * 0.35,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={['#9A6BFF', '#6E3CFB']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{
            flex: 1,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* antenna dot */}
          <View
            style={{
              position: 'absolute',
              top: -size * 0.08,
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04,
              backgroundColor: '#FF3D8B',
            }}
          />
          {/* eyes */}
          <View style={{ flexDirection: 'row', gap: size * 0.16, marginBottom: size * 0.06 }}>
            <Animated.View
              style={[
                eyeStyle,
                {
                  width: eyeSize,
                  height: eyeSize,
                  borderRadius: eyeSize / 2,
                  backgroundColor: '#0E0E12',
                },
              ]}
            />
            <Animated.View
              style={[
                eyeStyle,
                {
                  width: eyeSize,
                  height: eyeSize,
                  borderRadius: eyeSize / 2,
                  backgroundColor: '#0E0E12',
                },
              ]}
            />
          </View>
          {/* mouth */}
          <View
            style={{
              width: mouthW,
              height: mouthW * (mood === 'happy' ? 0.5 : 0.32),
              borderBottomLeftRadius: mouthW,
              borderBottomRightRadius: mouthW,
              backgroundColor: '#0E0E12',
            }}
          />
          {/* cheeks */}
          <View
            style={{
              position: 'absolute',
              flexDirection: 'row',
              gap: size * 0.44,
              bottom: size * 0.3,
            }}
          >
            <View
              style={{
                width: size * 0.1,
                height: size * 0.05,
                borderRadius: 99,
                backgroundColor: '#FF3D8B',
                opacity: 0.6,
              }}
            />
            <View
              style={{
                width: size * 0.1,
                height: size * 0.05,
                borderRadius: 99,
                backgroundColor: '#FF3D8B',
                opacity: 0.6,
              }}
            />
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}
