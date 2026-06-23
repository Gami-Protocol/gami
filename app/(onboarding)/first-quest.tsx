import { useRouter } from 'expo-router';
import { Bell, Check } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  GBody,
  GButtonPrimary,
  GCard,
  GConfetti,
  GListRow,
  GOnboardHeader,
  GScreen,
  GSticker,
} from '@/components/gami';
import { createGamiWallet } from '@/lib/gami-sdk';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

export default function FirstQuest() {
  const router = useRouter();
  const { biometricEnabled, notificationsEnabled, advanceStep, claimFirstQuest } =
    useOnboardingStore();
  const [confetti, setConfetti] = useState(false);

  const steps = [
    { label: 'Wallet created', done: true },
    { label: 'Face ID on', done: biometricEnabled },
    { label: 'Handle claimed', done: true },
    { label: 'Enable notifications', done: notificationsEnabled },
  ];
  const allDone = steps.every((s) => s.done);

  const claim = async () => {
    setConfetti(true);
    haptics.success();
    const wallet = await createGamiWallet();
    await wallet.awardXP(250);
    claimFirstQuest();
    advanceStep(10);
    setTimeout(() => router.push('/(onboarding)/xp'), 1100);
  };

  return (
    <GScreen>
      <GConfetti active={confetti} />
      <GOnboardHeader step={9} />
      <View className="flex-1 px-6">
        <Text className="text-ink-mute mt-4 font-mono text-[12px] tracking-widest">
          QUEST · 001
        </Text>

        <GCard gradient glow className="mt-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="font-display text-[22px] font-bold text-white"
                style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
              >
                First Steps
              </Text>
              <Text className="font-body mt-1 text-[13px] text-white/80">
                Finish setup, pocket your first XP.
              </Text>
            </View>
            <GSticker color="yellow" tilt={6}>
              +250 XP
            </GSticker>
          </View>
        </GCard>

        <View className="mt-6 gap-2.5">
          {steps.map((s) => (
            <GListRow
              key={s.label}
              highlight={!s.done}
              onPress={!s.done ? () => router.push('/(onboarding)/permissions') : undefined}
              icon={
                s.done ? (
                  <View className="bg-green h-6 w-6 items-center justify-center rounded-md">
                    <Check size={14} color="#0E0E12" strokeWidth={3} />
                  </View>
                ) : (
                  <View className="border-purple h-6 w-6 items-center justify-center rounded-md border-2">
                    <Bell size={13} color="#9A6BFF" />
                  </View>
                )
              }
              title={s.done ? s.label : `→ ${s.label}`}
            />
          ))}
        </View>

        {!allDone ? (
          <GBody color="mute" className="mt-4 text-center">
            Tap the highlighted step to finish your quest.
          </GBody>
        ) : null}
      </View>

      <View className="px-6 pb-6">
        <GButtonPrimary label="CLAIM 250 XP" disabled={!allDone} onPress={claim} />
      </View>
    </GScreen>
  );
}
