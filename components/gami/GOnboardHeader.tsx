import { View } from 'react-native';

import { GStepDots } from './GProgress';

/** Onboarding top progress bar (11 steps). */
export function GOnboardHeader({ step }: { step: number }) {
  return (
    <View className="px-6 pt-2 pb-2">
      <GStepDots n={11} active={step} />
    </View>
  );
}
