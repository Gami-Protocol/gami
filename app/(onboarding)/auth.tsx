import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  GBody,
  GButtonGhost,
  GButtonPrimary,
  GHeading,
  GOnboardHeader,
  GScreen,
  GSticker,
  useStaggerIn,
} from '@/components/gami';
import { useOnboardingStore } from '@/lib/store';

export default function Auth() {
  const router = useRouter();
  const advanceStep = useOnboardingStore((s) => s.advanceStep);
  const head = useStaggerIn(0);
  const body = useStaggerIn(1);

  const goCreate = () => {
    advanceStep(3);
    router.push('/(onboarding)/create-wallet');
  };

  return (
    <GScreen>
      <GOnboardHeader step={2} />
      <View className="flex-1 px-6">
        <Animated.View style={head} className="mt-6">
          <GHeading size="2xl">Choose your{'\n'}start.</GHeading>
          <GBody className="mt-3">New here or bringing a wallet with you?</GBody>
        </Animated.View>

        <Animated.View style={body} className="mt-10">
          <GButtonPrimary
            label="+ CREATE NEW WALLET"
            onPress={goCreate}
            badge={
              <View className="absolute -top-2 -right-2 z-10">
                <GSticker color="green" tilt={6}>
                  NEW
                </GSticker>
              </View>
            }
          />

          <View className="mt-4 flex-row gap-3">
            <GButtonGhost
              className="flex-1"
              label="⇩ IMPORT"
              sublabel="seed / private key"
              onPress={goCreate}
            />
            <GButtonGhost
              className="flex-1"
              label="⟁ APPLE"
              sublabel="one-tap"
              onPress={goCreate}
            />
          </View>

          <View className="my-7 flex-row items-center gap-3">
            <View className="bg-hairline h-px flex-1" />
            <Text className="text-ink-mute font-mono text-[11px] tracking-widest">OR</Text>
            <View className="bg-hairline h-px flex-1" />
          </View>

          <Text
            onPress={goCreate}
            className="font-body text-ink-dim text-center text-[14px]"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            I already have a Gami handle
          </Text>
        </Animated.View>
      </View>
    </GScreen>
  );
}
