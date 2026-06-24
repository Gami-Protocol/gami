import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  GBody,
  GButtonGhost,
  GButtonPrimary,
  GCodeInput,
  GHeading,
  GOnboardHeader,
  GScreen,
  useStaggerIn,
} from '@/components/gami';
import { signInWithEmail, signUpWithEmail, verifyCode } from '@/lib/auth';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

export default function Verify() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawEmail = Array.isArray(params.email) ? params.email[0] : (params.email ?? '');
  const email = rawEmail.toLowerCase();
  const mode: 'signup' | 'login' = params.mode === 'login' ? 'login' : 'signup';
  const advanceStep = useOnboardingStore((s) => s.advanceStep);

  const head = useStaggerIn(0);
  const body = useStaggerIn(1);

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const verify = async (value?: string) => {
    const token = (value ?? code).trim();
    if (token.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    const res = await verifyCode(email, token, mode);
    if (!res.ok) {
      setBusy(false);
      setCode('');
      haptics.error();
      setError(res.error);
      return;
    }
    haptics.success();
    if (mode === 'login') {
      // Returning user — wallet/handle/xp already relinked from their profile.
      router.replace('/(app)/home');
    } else {
      advanceStep(4);
      router.replace('/(onboarding)/create-wallet');
    }
  };

  const resend = async () => {
    setError(null);
    const res = mode === 'login' ? await signInWithEmail(email) : await signUpWithEmail(email);
    if (res.ok) {
      setResent(true);
      haptics.light();
    } else {
      setError(res.error);
    }
  };

  return (
    <GScreen>
      <GOnboardHeader step={mode === 'signup' ? 3 : 2} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          <Animated.View style={head} className="mt-6">
            <GHeading size="2xl">Enter your{'\n'}code.</GHeading>
            <GBody className="mt-3">
              We sent a 6-digit code to{' '}
              <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {email || 'your email'}
              </Text>
              .
            </GBody>
          </Animated.View>

          <Animated.View style={body} className="mt-9">
            <GCodeInput
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setError(null);
              }}
              onComplete={(v) => void verify(v)}
            />
            {error ? (
              <Text className="text-magenta mt-3 font-mono text-[11px]">{error}</Text>
            ) : resent ? (
              <Text className="text-green mt-3 font-mono text-[11px]">✓ new code sent</Text>
            ) : null}

            <View className="mt-7">
              <GButtonPrimary
                label={busy ? 'VERIFYING…' : 'VERIFY →'}
                onPress={() => void verify()}
                disabled={code.length !== 6 || busy}
              />
            </View>

            <View className="mt-4">
              <GButtonGhost label="↻ RESEND CODE" onPress={() => void resend()} />
            </View>

            <Text
              onPress={() => router.back()}
              className="text-ink-dim mt-6 text-center text-[14px]"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              Wrong email? Go back
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </GScreen>
  );
}
