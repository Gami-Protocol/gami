import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Gift, ExternalLink } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { PrivyClaimButton } from '@/components/ico/PrivyClaimButton';
import { GBody, GButtonGhost, GButtonPrimary, GCard, GConfetti, GMono, GScreen, GSticker } from '@/components/gami';
import { createGamiWallet } from '@/lib/gami-sdk';
import { getActiveChain, getVestingAddress } from '@/lib/chain';
import { privyEnabled } from '@/lib/privy';
import { useOnboardingStore } from '@/lib/store';

const ICO_CLAIM_URL = process.env.EXPO_PUBLIC_ICO_CLAIM_URL ?? 'https://gami.xyz/claim';

export default function ClaimScreen() {
  const router = useRouter();
  const walletAddress = useOnboardingStore((s) => s.walletAddress);
  const addXP = useOnboardingStore((s) => s.addXP);

  const [claimable, setClaimable] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const vestingConfigured = Boolean(getVestingAddress(getActiveChain()));

  useEffect(() => {
    let mounted = true;
    void createGamiWallet(walletAddress).then(async (wallet) => {
      const amount = await wallet.getClaimable();
      if (mounted) {
        setClaimable(amount);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [walletAddress]);

  const openWebClaim = () => {
    void WebBrowser.openBrowserAsync(ICO_CLAIM_URL);
  };

  const onClaimSuccess = () => {
    setConfetti(true);
    addXP(1000);
    setClaimable(0);
    setTimeout(() => setConfetti(false), 2000);
  };

  return (
    <GScreen>
      <GConfetti active={confetti} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View className="mb-4 flex-row items-center gap-3">
          <Gift size={24} color="#9A6BFF" />
          <Text
            className="font-display text-ink text-[22px] font-bold"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            Claim $GAMI
          </Text>
        </View>

        <GBody>Claim your vested tokens from the ICO. 15% unlocks at TGE, remainder vests over 12 months.</GBody>

        <GCard gradient className="mt-6 p-5">
          <Text className="font-mono text-[11px] text-white/70">CLAIMABLE</Text>
          {loading ? (
            <GMono className="mt-2 text-[28px] font-bold text-white">...</GMono>
          ) : (
            <GMono className="mt-2 text-[28px] font-bold text-white">
              {(claimable ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} GAMI
            </GMono>
          )}
          <View className="mt-3 flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${vestingConfigured ? 'bg-green' : 'bg-yellow'}`} />
            <Text className="font-mono text-[10px] text-white/70">
              {vestingConfigured ? 'vesting contract connected' : 'awaiting TGE deployment'}
            </Text>
          </View>
        </GCard>

        {claimable !== null && claimable > 0 ? (
          privyEnabled ? (
            <PrivyClaimButton
              claimable={claimable}
              claiming={claiming}
              setClaiming={setClaiming}
              onSuccess={onClaimSuccess}
              onFallback={openWebClaim}
            />
          ) : (
            <GButtonPrimary className="mt-6" label="CLAIM ON WEB →" onPress={openWebClaim} />
          )
        ) : (
          <GCard className="mt-6 p-4">
            <GBody>
              {vestingConfigured
                ? 'No tokens claimable yet. Check back after TGE or when your vesting cliff passes.'
                : 'TGE has not launched yet. Join the waitlist to reserve your allocation.'}
            </GBody>
          </GCard>
        )}

        <GCard className="mt-4 p-4" onPress={openWebClaim}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-display text-ink text-[15px] font-bold">Web claim portal</Text>
              <GBody className="mt-0.5">Full vesting schedule & tx history</GBody>
            </View>
            <ExternalLink size={20} color="#9A6BFF" />
          </View>
        </GCard>

        <GSticker color="purple" tilt={-3} className="mt-6">
          COMPLETE CLAIM AT TGE QUEST +1000 XP
        </GSticker>

        <GButtonGhost className="mt-6" label="← BACK" onPress={() => router.back()} />
      </ScrollView>
    </GScreen>
  );
}
