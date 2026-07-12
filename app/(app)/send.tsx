import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUp, Check, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GBody, GButtonPrimary, GCard, GMono, GScreen, GSticker } from '@/components/gami';
import { executeNovaProposal, getActiveChain } from '@/lib/chain';
import { currentStats } from '@/lib/gami-sdk';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';
import { usePrivyBridge } from '@/lib/privy-bridge';

const QUICK = [0.25, 0.5, 1] as const;

export default function Send() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { hideBalances, spendGami } = useOnboardingStore();
  const privy = usePrivyBridge();
  const stats = currentStats();
  const [recipient, setRecipient] = useState(
    Array.isArray(params.to) ? (params.to[0] ?? '') : (params.to ?? ''),
  );
  const [amount, setAmount] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const numeric = Number.parseFloat(amount) || 0;
  const balance = stats.gamiBalance;
  const recipientOk = /^0x[0-9a-fA-F]{40}$/.test(recipient.trim());
  const amountOk = numeric > 0 && numeric <= balance;
  const canSend = recipientOk && amountOk && !sent;

  const error = useMemo(() => {
    if (numeric > balance) return 'Not enough $GAMI for that.';
    return null;
  }, [numeric, balance]);

  const onSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    try {
      const provider = await privy.getWalletProvider();
      const account = privy.walletAddress;
      if (!provider || !account?.startsWith('0x')) {
        throw new Error('Sign in with Privy before sending GAMI.');
      }
      await executeNovaProposal(provider, account as `0x${string}`, {
        id: `manual_${Date.now()}`,
        kind: 'gami_transfer',
        chain: getActiveChain(),
        from: account,
        to: recipient.trim(),
        amount: numeric.toString(),
        symbol: 'GAMI',
      });
      spendGami(Number(numeric.toFixed(2)));
      haptics.success();
      setSent(true);
    } catch (sendError) {
      Alert.alert(
        'Transaction not submitted',
        sendError instanceof Error ? sendError.message : 'The wallet rejected this action.',
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <GScreen>
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-green/20 border-green/60 h-20 w-20 items-center justify-center rounded-full border-2">
            <Check size={40} color="#3DF5A0" />
          </View>
          <Text
            className="font-display mt-6 text-[28px] font-bold text-white"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            Sent!
          </Text>
          <GBody className="mt-2 text-center">
            {numeric.toFixed(2)} $GAMI on its way to{'\n'}
            <Text className="text-ink font-mono">{recipient.trim()}</Text>
          </GBody>
          <GButtonPrimary label="DONE" className="mt-8 w-full" onPress={() => router.back()} />
        </View>
      </GScreen>
    );
  }

  return (
    <GScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <Text className="text-ink-mute font-mono text-[13px] tracking-widest">SEND $GAMI</Text>
          <Pressable
            onPress={() => router.back()}
            className="border-hairline bg-surface h-9 w-9 items-center justify-center rounded-full border"
          >
            <X size={18} color="#A09CB8" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <GCard className="items-center py-6">
            <Text className="font-mono text-[11px] tracking-widest text-white/60">BALANCE</Text>
            <GMono className="mt-1 text-[28px] font-bold text-white">
              {hideBalances ? '••••' : balance.toFixed(2)}
            </GMono>
            <Text className="text-ink-dim mt-0.5 font-mono text-[11px]">$GAMI available</Text>
          </GCard>

          <Text className="text-ink-mute mt-6 font-mono text-[11px] tracking-widest">TO</Text>
          <View className="border-hairline bg-surface mt-2 rounded-2xl border px-4 py-3.5">
            <TextInput
              value={recipient}
              onChangeText={setRecipient}
              placeholder="0x wallet address"
              placeholderTextColor="#6B6880"
              autoCapitalize="none"
              autoCorrect={false}
              className="text-ink font-mono text-[15px]"
              style={{ fontFamily: 'JetBrainsMono_400Regular' }}
            />
          </View>

          <Text className="text-ink-mute mt-5 font-mono text-[11px] tracking-widest">AMOUNT</Text>
          <View className="border-hairline bg-surface mt-2 flex-row items-center rounded-2xl border px-4 py-3.5">
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor="#6B6880"
              keyboardType="decimal-pad"
              className="text-ink flex-1 font-mono text-[20px] font-bold"
              style={{ fontFamily: 'JetBrainsMono_700Bold' }}
            />
            <Text className="text-ink-dim font-mono text-[13px]">$GAMI</Text>
          </View>

          <View className="mt-3 flex-row gap-2">
            {QUICK.map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  haptics.light();
                  setAmount((balance * p).toFixed(2));
                }}
                className="border-hairline bg-surface flex-1 items-center rounded-xl border py-2.5"
              >
                <Text className="text-ink-dim font-mono text-[12px]">
                  {p === 1 ? 'MAX' : `${p * 100}%`}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? (
            <Text className="text-danger mt-3 font-mono text-[12px]">{error}</Text>
          ) : (
            <View className="mt-3 flex-row items-center gap-2">
              <GSticker color="cyan" tilt={-3}>
                ~0.001 fee
              </GSticker>
              <Text className="text-ink-mute font-mono text-[11px]">gami-1 network · instant</Text>
            </View>
          )}
        </ScrollView>

        <View className="px-5 pb-4">
          <GButtonPrimary
            label={sending ? 'OPENING PRIVY…' : 'REVIEW + SIGN'}
            disabled={!canSend || sending}
            icon={<ArrowUp size={18} color={canSend ? '#fff' : '#6B6880'} />}
            onPress={() => void onSend()}
          />
        </View>
      </KeyboardAvoidingView>
    </GScreen>
  );
}
