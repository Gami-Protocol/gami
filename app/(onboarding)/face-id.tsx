import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Check, ScanFace } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  GBody,
  GButtonPrimary,
  GHeading,
  GListRow,
  GOnboardHeader,
  GProgressBar,
  GScreen,
} from '@/components/gami';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

export default function FaceId() {
  const router = useRouter();
  const { advanceStep, setBiometric } = useOnboardingStore();
  const [enabled, setEnabled] = useState(false);

  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + sweep.value * 0.5,
    transform: [{ scale: 0.9 + sweep.value * 0.1 }],
  }));

  const proceed = () => {
    advanceStep(6);
    setTimeout(() => router.replace('/(onboarding)/handle'), 600);
  };

  const enable = async () => {
    try {
      if (Platform.OS === 'web') {
        // No biometric on web — simulate success.
        setEnabled(true);
        setBiometric(true);
        haptics.success();
        proceed();
        return;
      }
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) {
        // Device lacks biometrics — accept and continue.
        setEnabled(true);
        setBiometric(true);
        proceed();
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Face ID for Gami Wallet',
      });
      if (res.success) {
        setEnabled(true);
        setBiometric(true);
        haptics.success();
        proceed();
      } else {
        haptics.warning();
      }
    } catch {
      haptics.warning();
    }
  };

  const skip = () => {
    advanceStep(6);
    router.replace('/(onboarding)/handle');
  };

  return (
    <GScreen>
      <GOnboardHeader step={5} />
      <View className="flex-1 px-6">
        <GHeading size="2xl" className="mt-6">
          Lock it with{'\n'}your face.
        </GHeading>
        <GBody className="mt-3">Biometric unlock + sign. No passwords, ever.</GBody>

        <View className="my-12 items-center justify-center">
          <Animated.View
            style={sweepStyle}
            className="border-purple h-48 w-48 items-center justify-center rounded-full border-2"
          >
            <View className="border-purple-lo/60 h-36 w-36 items-center justify-center rounded-full border-2">
              <View
                className={`h-24 w-24 items-center justify-center rounded-full ${enabled ? 'bg-green' : 'bg-surface'}`}
                style={{
                  shadowColor: enabled ? '#3DF5A0' : '#6E3CFB',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.7,
                  shadowRadius: 30,
                }}
              >
                {enabled ? (
                  <Check size={44} color="#0E0E12" strokeWidth={3} />
                ) : (
                  <ScanFace size={48} color="#9A6BFF" />
                )}
              </View>
            </View>
          </Animated.View>
        </View>

        {enabled ? (
          <GListRow
            icon={<Check size={18} color="#3DF5A0" />}
            title="Face ID enabled"
            className="border-green/50"
          />
        ) : null}
      </View>

      <View className="px-6 pb-6">
        <GProgressBar value={enabled ? 0.55 : 0.45} className="mb-5" />
        <GButtonPrimary label="ENABLE FACE ID" onPress={enable} />
        <View className="mt-4 items-center">
          <Text
            onPress={skip}
            className="font-body text-ink-dim text-[14px]"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            Skip for now
          </Text>
        </View>
      </View>
    </GScreen>
  );
}
