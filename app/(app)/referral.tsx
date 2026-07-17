import * as Clipboard from 'expo-clipboard';
import { Share2, Copy, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';

import { GBody, GCard, GMono, GScreen, GSticker } from '@/components/gami';
import { haptics } from '@/lib/haptics';
import { generateReferralCode, referralDeepLink, referralWebLink } from '@/lib/referral';
import { useOnboardingStore } from '@/lib/store';

export default function ReferralScreen() {
  const handle = useOnboardingStore((s) => s.handle);
  const walletAddress = useOnboardingStore((s) => s.walletAddress);
  const referralCode = useOnboardingStore((s) => s.referralCode);

  const code = useMemo(
    () => referralCode ?? generateReferralCode(handle || 'legend', walletAddress),
    [referralCode, handle, walletAddress],
  );

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    haptics.success();
  };

  const shareReferral = async () => {
    const message = `Join Gami Wallet with my code ${code} and earn +50 XP! ${referralWebLink(code)}`;
    try {
      await Share.share({ message });
    } catch {
      await Clipboard.setStringAsync(message);
    }
    haptics.success();
  };

  return (
    <GScreen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View className="mb-4 flex-row items-center gap-3">
          <Users size={24} color="#FF3D8B" />
          <Text
            className="font-display text-ink text-[22px] font-bold"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            Refer & Earn
          </Text>
        </View>

        <GBody>Invite friends to Gami Wallet. You earn +100 XP per referral, they get +50 XP.</GBody>

        <GCard gradient className="mt-6 items-center p-6">
          <Text className="font-mono text-[11px] text-white/70">YOUR CODE</Text>
          <GMono className="mt-2 text-[28px] font-bold text-white">{code}</GMono>
          <GSticker color="yellow" tilt={4} className="mt-4">
            +100 XP PER REFERRAL
          </GSticker>
        </GCard>

        <View className="mt-6 flex-row gap-3">
          <Pressable onPress={copyCode} className="border-hairline bg-surface flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-4">
            <Copy size={18} color="#9A6BFF" />
            <Text className="font-mono text-[12px] font-bold">COPY</Text>
          </Pressable>
          <Pressable onPress={shareReferral} className="border-hairline bg-surface flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-4">
            <Share2 size={18} color="#FF3D8B" />
            <Text className="font-mono text-[12px] font-bold">SHARE</Text>
          </Pressable>
        </View>

        <GCard className="mt-6 p-4">
          <Text className="font-display text-ink text-[15px] font-bold">How it works</Text>
          <View className="mt-3 gap-2">
            <GBody>1. Share your code or link</GBody>
            <GBody>2. Friend downloads Gami Wallet</GBody>
            <GBody>3. They enter your code during onboarding</GBody>
            <GBody>4. Both earn XP instantly</GBody>
          </View>
        </GCard>

        <GCard className="mt-4 p-4">
          <Text className="font-mono text-[10px] text-ink-dim">DEEP LINK</Text>
          <GMono className="mt-1 text-[12px]">{referralDeepLink(code)}</GMono>
        </GCard>
      </ScrollView>
    </GScreen>
  );
}
