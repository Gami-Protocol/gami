import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GAvatar, GButtonPrimary, GHeading, GOnboardHeader, GScreen } from '@/components/gami';
import { AVATAR_SWATCHES, type AvatarColorId } from '@/lib/config';
import { haptics } from '@/lib/haptics';
import { monogram, normaliseHandle, useOnboardingStore } from '@/lib/store';

type AvailState = 'idle' | 'checking' | 'free' | 'taken';

// Pretend these handles are already claimed.
const TAKEN = new Set(['admin', 'gami', 'nova', 'satoshi', 'test']);

export default function Handle() {
  const router = useRouter();
  const { handle, avatarId, setHandle, setAvatar, advanceStep } = useOnboardingStore();
  const [value, setValue] = useState(handle || '');
  const [avail, setAvail] = useState<AvailState>('idle');

  const clean = useMemo(() => normaliseHandle(value), [value]);

  useEffect(() => {
    if (clean.length < 3) {
      setAvail('idle');
      return undefined;
    }
    setAvail('checking');
    const t = setTimeout(() => {
      setAvail(TAKEN.has(clean) ? 'taken' : 'free');
    }, 500);
    return () => clearTimeout(t);
  }, [clean]);

  const valid = avail === 'free';
  const mono = monogram(clean || 'NX');

  const pickColor = (id: AvatarColorId) => {
    haptics.selection();
    setAvatar(id);
  };

  const claim = () => {
    if (!valid) return;
    setHandle(clean);
    advanceStep(7);
    router.push('/(onboarding)/nova');
  };

  return (
    <GScreen>
      <GOnboardHeader step={6} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          <GHeading size="2xl" className="mt-6">
            Pick your{'\n'}character.
          </GHeading>

          <View className="mt-8 items-center">
            <GAvatar colorId={avatarId} monogram={mono} size={104} />
          </View>

          <View className="mt-7 flex-row justify-center gap-3">
            {AVATAR_SWATCHES.map((s) => {
              const selected = s.id === avatarId;
              return (
                <Pressable key={s.id} onPress={() => pickColor(s.id)}>
                  <LinearGradient
                    colors={[s.hex, s.hexTo]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      borderWidth: selected ? 2 : 0,
                      borderColor: '#F4F2FF',
                    }}
                  />
                </Pressable>
              );
            })}
          </View>

          <View className="mt-9">
            <Text className="text-ink-mute mb-2 font-mono text-[11px] tracking-widest">HANDLE</Text>
            <View className="border-hairline bg-surface flex-row items-center rounded-2xl border px-4">
              <Text
                className="text-ink-dim font-mono text-[18px]"
                style={{ fontFamily: 'JetBrainsMono_600SemiBold' }}
              >
                @
              </Text>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder="noxx_"
                placeholderTextColor="#6B6880"
                autoCapitalize="none"
                autoCorrect={false}
                className="text-ink ml-1 flex-1 py-4 font-mono text-[18px]"
                style={{ fontFamily: 'JetBrainsMono_600SemiBold' }}
              />
              {avail === 'free' ? (
                <Check size={20} color="#3DF5A0" />
              ) : avail === 'taken' ? (
                <X size={20} color="#FF3D8B" />
              ) : null}
            </View>
            <Text className="text-ink-mute mt-2 font-mono text-[11px]">
              {avail === 'taken'
                ? '✕ taken — try another'
                : avail === 'free'
                  ? `✓ available · saves to ${clean}.gami`
                  : avail === 'checking'
                    ? 'checking…'
                    : '3+ characters, letters / numbers / _'}
            </Text>
          </View>
        </View>

        <View className="px-6 pb-6">
          <GButtonPrimary label="CLAIM IT →" onPress={claim} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
    </GScreen>
  );
}
