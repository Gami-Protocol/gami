import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GProgressBar, GScreen, NovaMascot } from '@/components/gami';
import { useOnboardingStore } from '@/lib/store';

export default function Splash() {
  const router = useRouter();
  const onboarded = useOnboardingStore((s) => s.onboarded);
  const [progress, setProgress] = useState(0);

  const cardScale = useSharedValue(0.6);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardScale.value > 0.62 ? 1 : 0,
    transform: [{ scale: cardScale.value }],
  }));

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    const start = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(1, (Date.now() - start) / 1400);
      setProgress(pct);
      if (pct >= 1) clearInterval(tick);
    }, 60);

    const timer = setTimeout(() => {
      router.replace(onboarded ? '/(app)/home' : '/(onboarding)/welcome');
    }, 1600);
    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [router, cardScale, onboarded]);

  return (
    <GScreen statusBar={false}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center">
          <Animated.View style={cardStyle} className="relative">
            <View
              className="overflow-hidden rounded-3xl"
              style={{
                shadowColor: '#6E3CFB',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 50,
                elevation: 16,
              }}
            >
              <Image
                source={require('@/assets/icon.png')}
                style={{ width: 128, height: 128 }}
                resizeMode="cover"
              />
            </View>
            {/* mascot peeking over top-right */}
            <View className="absolute -top-5 -right-5">
              <NovaMascot size={48} mood="happy" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).springify()} className="mt-10 items-center">
            <Text
              className="font-display text-ink text-[42px] leading-[44px] font-bold tracking-tight"
              style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              GAMI
            </Text>
            <Text
              className="font-display text-magenta text-[42px] leading-[44px] font-bold tracking-tight"
              style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              WALLET
            </Text>
            <Text className="text-ink-mute mt-3 font-mono text-[11px] tracking-[2px]">
              THE WALLET THAT LEVELS YOU UP
            </Text>
          </Animated.View>
        </View>
      </View>

      <View className="px-12 pb-10">
        <GProgressBar value={progress} />
      </View>
    </GScreen>
  );
}
