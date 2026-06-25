import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  GBackendBanner,
  GBody,
  GButtonPrimary,
  GHeading,
  GOnboardHeader,
  GScreen,
  GSticker,
  useStaggerIn,
} from '@/components/gami';
import { signInWithEmail } from '@/lib/auth';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const head = useStaggerIn(0);
  const body = useStaggerIn(1);

  const [email, setEmailValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim());

  const sendCode = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const clean = email.trim().toLowerCase();
    const res = await signInWithEmail(clean);
    setBusy(false);
    if (!res.ok) {
      haptics.error();
      setError(res.error);
      return;
    }
    haptics.success();
    setEmail(clean);
    router.push({ pathname: '/(onboarding)/verify', params: { email: clean, mode: 'login' } });
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
            <GSticker color="cyan" tilt={-6}>
              WELCOME BACK
            </GSticker>
            <GHeading size="2xl" className="mt-4">
              Sign back{'\n'}in.
            </GHeading>
            <GBody className="mt-3">
              Enter the email tied to your wallet. We&apos;ll send a 6-digit code and restore your
              account.
            </GBody>
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
                onSubmitEditing={sendCode}
              />
            </View>
            {error ? (
              <Text className="text-magenta mt-2 font-mono text-[11px]">{error}</Text>
            ) : (
              <Text className="text-ink-mute mt-2 font-mono text-[11px]">
                your wallet, XP and badges come right back
              </Text>
            )}

            <View className="mt-7">
              <GButtonPrimary
                label={busy ? 'SENDING CODE…' : 'SEND ME A CODE →'}
                onPress={sendCode}
                disabled={!valid || busy}
              />
            </View>

            <Text
              onPress={() => router.back()}
              className="text-ink-dim mt-6 text-center text-[14px]"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              New here? Create a wallet
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </GScreen>
  );
}
