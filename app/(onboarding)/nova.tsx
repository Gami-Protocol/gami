import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GButtonPrimary, GHeading, GOnboardHeader, GScreen, NovaMascot } from '@/components/gami';
import { type NovaTone } from '@/lib/config';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

const TONES: { id: NovaTone; label: string }[] = [
  { id: 'shy', label: 'SHY' },
  { id: 'chill', label: 'CHILL' },
  { id: 'hype', label: 'HYPE' },
];

export default function Nova() {
  const router = useRouter();
  const { handle, novaTone, setNovaTone, advanceStep } = useOnboardingStore();
  const full = `Hey @${handle || 'noxx_'} — I'm your wallet's brain.`;
  const [typed, setTyped] = useState('');

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 35);
    return () => clearInterval(t);
  }, [full]);

  return (
    <GScreen>
      <GOnboardHeader step={7} />
      <View className="flex-1 px-6">
        <GHeading size="2xl" className="mt-4">
          meet <GHeading.Accent color="purple">NOVA.</GHeading.Accent>
        </GHeading>

        <View className="my-8 items-center">
          <NovaMascot size={132} mood="happy" />
        </View>

        {/* speech bubble */}
        <View className="rounded-2xl bg-white p-4">
          <Text
            className="font-display text-bg text-[16px] font-semibold"
            style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
          >
            “{typed}”
          </Text>
          <Text className="font-body text-ink-mute mt-2 text-[13px]">
            Ask me to send, swap, find{' '}
            <Text
              className="bg-yellow font-body text-bg"
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              {' '}
              quests{' '}
            </Text>
            , or explain anything.
          </Text>
        </View>

        <Text className="text-ink-mute mt-8 font-mono text-[11px] tracking-widest">
          NOVA&apos;S VIBE
        </Text>
        <View className="mt-3 flex-row gap-3">
          {TONES.map((t) => {
            const selected = t.id === novaTone;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  haptics.selection();
                  setNovaTone(t.id);
                }}
                className={`flex-1 items-center rounded-full border py-3 ${
                  selected ? 'border-purple bg-purple/20' : 'border-hairline bg-surface'
                }`}
              >
                <Text
                  className={`font-mono text-[13px] font-bold tracking-wide ${selected ? 'text-purple-lo' : 'text-ink-dim'}`}
                  style={{ fontFamily: 'JetBrainsMono_700Bold' }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="px-6 pb-6">
        <GButtonPrimary
          label="NICE TO MEET YOU →"
          onPress={() => {
            advanceStep(8);
            router.push('/(onboarding)/interests');
          }}
        />
      </View>
    </GScreen>
  );
}
