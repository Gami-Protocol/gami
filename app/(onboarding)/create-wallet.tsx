import { useRouter } from 'expo-router';
import { Check, Loader } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import {
  GBody,
  GButtonGhost,
  GHeading,
  GOnboardHeader,
  GProgressBar,
  GScreen,
} from '@/components/gami';
import { createGamiWallet } from '@/lib/gami-sdk';
import { syncProfile } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

const STEPS = [
  'Generating keypair',
  'Securing in device keystore',
  'Creating smart account on gami-1',
];

function Spinner() {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
  }, [rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <Loader size={18} color="#9A6BFF" />
    </Animated.View>
  );
}

export default function CreateWallet() {
  const router = useRouter();
  const advanceStep = useOnboardingStore((s) => s.advanceStep);
  const { ensureWallet } = useAuth();
  const [done, setDone] = useState(-1);
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  const pulse = useSharedValue(1);
  const glyphStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const run = useCallback(() => {
    setFailed(false);
    setDone(-1);
    let i = 0;
    const advance = () => {
      i += 1;
      setDone(i - 1);
      if (i === STEPS.length) {
        // step 3 → resolve the real embedded wallet address (creating it via
        // Privy if needed) before handing it to the SDK. On the fallback path
        // ensureWallet returns the stored/mock address (or null → mock gen).
        ensureWallet()
          .then((address) => createGamiWallet(address))
          .then(() => {
            // Link the freshly created wallet address to the account row.
            void syncProfile();
            haptics.success();
            advanceStep(5);
            setTimeout(() => router.replace('/(onboarding)/face-id'), 500);
          })
          .catch(() => setFailed(true));
        return;
      }
      setTimeout(advance, 650);
    };
    setTimeout(advance, 500);
  }, [advanceStep, router, ensureWallet]);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    if (ran.current) return;
    ran.current = true;
    run();
  }, [pulse, run]);

  const progress = (done + 1) / STEPS.length;

  return (
    <GScreen>
      <GOnboardHeader step={3} />
      <View className="flex-1 px-6">
        <View className="mt-6 items-center">
          <Animated.View style={glyphStyle}>
            <LinearGradient
              colors={['#9A6BFF', '#6E3CFB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6E3CFB',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 40,
              }}
            >
              <View className="h-9 w-12 rounded-md border-2 border-white" />
            </LinearGradient>
          </Animated.View>
        </View>

        <GHeading size="xl" className="mt-8">
          Forging your{'\n'}wallet…
        </GHeading>
        <GBody className="mt-3">Generating keys on-device. Nothing leaves your phone.</GBody>

        <View className="mt-8 gap-3">
          {STEPS.map((label, i) => {
            const isDone = i <= done;
            const isActive = i === done + 1 && !failed && done < STEPS.length - 1;
            return (
              <View
                key={label}
                className="border-hairline bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
              >
                <View className="h-6 w-6 items-center justify-center">
                  {isDone ? (
                    <View className="bg-green h-6 w-6 items-center justify-center rounded-full">
                      <Check size={14} color="#0E0E12" strokeWidth={3} />
                    </View>
                  ) : isActive ? (
                    <Spinner />
                  ) : (
                    <View className="bg-surface-2 h-2 w-2 rounded-full" />
                  )}
                </View>
                <Text
                  className="font-body text-ink text-[14px]"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="mt-8">
          <GProgressBar value={progress} />
        </View>

        {failed ? (
          <View className="mt-6">
            <GBody color="ink" className="mb-3 text-center">
              Something glitched. Let&apos;s try again.
            </GBody>
            <GButtonGhost label="RETRY" onPress={run} />
          </View>
        ) : null}
      </View>
    </GScreen>
  );
}
