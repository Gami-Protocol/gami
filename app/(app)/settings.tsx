import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ChevronLeft, Copy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GButtonGhost, GMono, GScreen, GToggleRow } from '@/components/gami';
import { signOut as authSignOut } from '@/lib/auth';
import { privyEnabled } from '@/lib/privy';
import { usePrivyBridge } from '@/lib/privy-bridge';
import { haptics } from '@/lib/haptics';
import { truncateAddress, useOnboardingStore } from '@/lib/store';

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-ink-mute mt-7 mb-3 font-mono text-[11px] tracking-widest">
      {children}
    </Text>
  );
}

function MetaRow({
  title,
  meta,
  onPress,
  copyable,
}: {
  title: string;
  meta: string;
  onPress?: () => void;
  copyable?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="border-hairline bg-surface flex-row items-center justify-between rounded-2xl border px-4 py-3.5"
    >
      <Text className="font-body text-ink text-[15px]" style={{ fontFamily: 'Inter_500Medium' }}>
        {title}
      </Text>
      <View className="flex-row items-center gap-2">
        <GMono className="text-ink-dim text-[13px]">{meta}</GMono>
        {copyable ? <Copy size={15} color="#6B6880" /> : null}
      </View>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const {
    handle,
    email,
    walletAddress,
    biometricEnabled,
    notificationsEnabled,
    rewardAlertsEnabled,
    hideBalances,
    novaAssistantEnabled,
    soundEnabled,
    setBiometric,
    setNotifications,
    setRewardAlerts,
    setHideBalances,
    setNovaAssistant,
    setSound,
  } = useOnboardingStore();
  const [confirm, setConfirm] = useState(false);
  const privy = usePrivyBridge();

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    haptics.success();
  };

  const signOut = async () => {
    if (privyEnabled) await privy.logout();
    await authSignOut();
    router.replace('/(onboarding)/login');
  };

  return (
    <GScreen>
      <View className="flex-row items-center gap-3 px-4 pt-1 pb-2">
        <ChevronLeft size={24} color="#F4F2FF" onPress={() => router.back()} />
        <Text className="text-ink font-mono text-[15px] tracking-widest">SETTINGS</Text>
        <View className="flex-1" />
        <GMono className="text-ink-mute text-[11px]">v1.0.0</GMono>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <SectionLabel>ACCOUNT</SectionLabel>
        <View className="gap-2.5">
          <MetaRow title="Username" meta={`@${handle || 'noxx_'}`} />
          <MetaRow title="Email" meta={email} />
          <MetaRow
            title="Wallet address"
            meta={truncateAddress(walletAddress)}
            copyable
            onPress={copyAddress}
          />
        </View>

        <SectionLabel>SECURITY</SectionLabel>
        <View className="gap-2.5">
          <GToggleRow
            title="Face ID unlock"
            value={biometricEnabled}
            onValueChange={setBiometric}
          />
          <MetaRow title="Auto-lock" meta="1 minute" />
          <MetaRow title="Backup phrase" meta="Not backed up" />
          <GToggleRow title="Hide balances" value={hideBalances} onValueChange={setHideBalances} />
        </View>

        <SectionLabel>APP</SectionLabel>
        <View className="gap-2.5">
          <GToggleRow
            title="Push notifications"
            value={notificationsEnabled}
            onValueChange={setNotifications}
          />
          <GToggleRow
            title="Reward alerts"
            value={rewardAlertsEnabled}
            onValueChange={setRewardAlerts}
          />
          <GToggleRow
            title="NOVA assistant"
            value={novaAssistantEnabled}
            onValueChange={setNovaAssistant}
          />
          <GToggleRow title="Sound effects" value={soundEnabled} onValueChange={setSound} />
          <GToggleRow title="Dark mode" value disabled onValueChange={() => {}} meta="locked on" />
        </View>

        <View className="mt-8">
          {confirm ? (
            <View className="border-danger/40 bg-surface gap-3 rounded-2xl border p-4">
              <Text className="font-body text-ink text-center text-[14px]">
                Sign out? You can sign back in anytime with your email code to restore your wallet.
              </Text>
              <View className="flex-row gap-3">
                <GButtonGhost className="flex-1" label="CANCEL" onPress={() => setConfirm(false)} />
                <GButtonGhost
                  className="flex-1"
                  label="SIGN OUT"
                  destructive
                  onPress={() => void signOut()}
                />
              </View>
            </View>
          ) : (
            <GButtonGhost label="SIGN OUT" destructive onPress={() => setConfirm(true)} />
          )}
        </View>
      </ScrollView>
    </GScreen>
  );
}
