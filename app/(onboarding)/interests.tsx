import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { GBody, GButtonPrimary, GChip, GHeading, GOnboardHeader, GScreen } from '@/components/gami';
import { INTERESTS } from '@/lib/config';
import { useOnboardingStore } from '@/lib/store';

export default function Interests() {
  const router = useRouter();
  const { interests, toggleInterest, advanceStep } = useOnboardingStore();
  const enough = interests.length >= 3;

  return (
    <GScreen>
      <GOnboardHeader step={8} />
      <View className="flex-1 px-6">
        <GHeading size="2xl" className="mt-6">
          What&apos;s your{'\n'}vibe?
        </GHeading>
        <GBody className="mt-3">NOVA tunes your quests to this. Pick a few.</GBody>

        <View className="mt-7 flex-row flex-wrap gap-2.5">
          {INTERESTS.map((it) => (
            <GChip
              key={it.id}
              label={it.label}
              selected={interests.includes(it.id)}
              onPress={() => toggleInterest(it.id)}
            />
          ))}
        </View>

        <Text className="text-ink-mute mt-6 font-mono text-[12px]">
          {interests.length} / {INTERESTS.length} picked
        </Text>
      </View>

      <View className="px-6 pb-6">
        <GButtonPrimary
          label="SET MY VIBE →"
          disabled={!enough}
          onPress={() => {
            advanceStep(9);
            router.push('/(onboarding)/first-quest');
          }}
        />
      </View>
    </GScreen>
  );
}
