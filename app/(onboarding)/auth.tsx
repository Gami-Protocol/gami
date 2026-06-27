import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  GBackendBanner,
  GBody,
  GButtonGhost,
  GButtonPrimary,
  GHeading,
  GOnboardHeader,
  GScreen,
  GSticker,
  useStaggerIn,
} from '@/components/gami';
import { useAuth } from '@/lib/useAuth';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const router = useRouter();
  const { advanceStep, setEmail } = useOnboardingStore();
  const { sendSignupCode } = useAuth();
  const head = useStaggerIn(0);
  const body = useStaggerIn(1);

  const [email, setEmailValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim());

  const createWallet = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const clean = email.trim().toLowerCase();
    const res = await sendSignupCode(clean);
    setBusy(false);
    if (!res.ok) {
      haptics.error();
      setError(res.error);
      return;
    }
    haptics.success();
    setEmail(clean);
    advanceStep(3);
    router.push({ pathname: '/(onboarding)/verify', params: { email: clean, mode: 'signup' } });
  };

  return (
    <GScreen>
      <GOnboardHeader step={2} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          <Animated.View style={head} className="mt-6">
            <GHeading size="2xl">Choose your{'\n'}start.</GHeading>
            <GBody className="mt-3">New here or bringing a wallet with you?</GBody>
          </Animated.View>

          <Animated.View style={body} className="mt-9">
            <GBackendBanner className="mb-5" />
            <Text className="text-ink-mute mb-2 font-mono text-[11px] tracking-widest">EMAIL</Text>
            <View className="border-hairline bg-surface flex-row items-center rounded-2xl border px-4">
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmailValue(t);
                  setError(null);
                }}
                placeholder="you@gami.xyz"
                placeholderTextColor="#6B6880"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                className="text-ink flex-1 py-4 text-[16px]"
                style={{ fontFamily: 'Inter_500Medium' }}
                onSubmitEditing={createWallet}
              />
            </View>
            {error ? (
              <Text className="text-magenta mt-2 font-mono text-[11px]">{error}</Text>
            ) : (
              <Text className="text-ink-mute mt-2 font-mono text-[11px]">
                no passwords · just a code
              </Text>
            )}

            <View className="mt-7">
              <GButtonPrimary
                label={busy ? 'SENDING CODE…' : '+ CREATE NEW WALLET'}
                onPress={createWallet}
                disabled={!valid || busy}
                badge={
                  <View className="absolute -top-2 -right-2 z-10">
                    <GSticker color="green" tilt={6}>
                      NEW
                    </GSticker>
                  </View>
                }
              />
            </View>

            <View className="mt-4 flex-row gap-3">
              <GButtonGhost
                className="flex-1"
                label="⇩ IMPORT"
                sublabel="seed / private key"
                onPress={() => router.push('/(onboarding)/login')}
              />
              <GButtonGhost
                className="flex-1"
                label="⟁ APPLE"
                sublabel="one-tap"
                onPress={createWallet}
              />
            </View>

            <View className="my-7 flex-row items-center gap-3">
              <View className="bg-hairline h-px flex-1" />
              <Text className="text-ink-mute font-mono text-[11px] tracking-widest">OR</Text>
              <View className="bg-hairline h-px flex-1" />
            </View>

            <Pressable onPress={() => router.push('/(onboarding)/login')}>
              <Text className="text-ink-dim text-center font-mono text-[12px]">
                I already have a Gami handle
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </GScreen>
  );
}
