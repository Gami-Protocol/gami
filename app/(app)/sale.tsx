import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Coins, ExternalLink } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  GBody,
  GButtonGhost,
  GButtonPrimary,
  GCard,
  GMono,
  GScreen,
  GSticker,
} from '@/components/gami';
import {
  buildContributeUrl,
  fetchSaleEligibility,
  fetchSaleStats,
  mapPhaseToStore,
  type SaleEligibility,
  type SaleStats,
} from '@/lib/sale';
import { useOnboardingStore } from '@/lib/store';

export default function SaleScreen() {
  const router = useRouter();
  const walletAddress = useOnboardingStore((s) => s.walletAddress);
  const referralCode = useOnboardingStore((s) => s.referralCode);
  const setIcoParticipantId = useOnboardingStore((s) => s.setIcoParticipantId);
  const setSalePhase = useOnboardingStore((s) => s.setSalePhase);

  const [stats, setStats] = useState<SaleStats | null>(null);
  const [eligibility, setEligibility] = useState<SaleEligibility | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, e] = await Promise.all([
      fetchSaleStats(),
      walletAddress ? fetchSaleEligibility(walletAddress) : Promise.resolve(null),
    ]);
    setStats(s);
    setEligibility(e);
    if (e?.participant_id) setIcoParticipantId(e.participant_id);
    if (s?.current_phase) setSalePhase(mapPhaseToStore(s.current_phase));
    else if (e?.on_waitlist) setSalePhase('waitlist');
  }, [walletAddress, setIcoParticipantId, setSalePhase]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const raised = stats?.total_raised_usd ?? 0;
  const cap = stats?.hard_cap_usd ?? 2_160_000;
  const pct = cap > 0 ? Math.min(100, (raised / cap) * 100) : 0;

  const openContribute = () => {
    const url = buildContributeUrl(walletAddress, referralCode);
    void WebBrowser.openBrowserAsync(url);
  };

  const kyc = eligibility?.kyc_status ?? 'pending';
  const ctaLabel =
    kyc === 'approved'
      ? 'CONTRIBUTE USDC →'
      : kyc === 'rejected'
        ? 'KYC REJECTED'
        : 'COMPLETE KYC →';

  return (
    <GScreen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mb-4 flex-row items-center gap-3">
          <Coins size={24} color="#FFD23D" />
          <Text
            className="font-display text-ink text-[22px] font-bold"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            Token Sale
          </Text>
        </View>

        <GBody>
          Track the raise, complete KYC, and contribute USDC on Base via the web portal.
        </GBody>

        <GCard gradient className="mt-6 p-5">
          <Text className="font-mono text-[11px] text-white/70">
            PHASE · {(stats?.current_phase ?? 'public').toUpperCase()}
          </Text>
          <GMono className="mt-2 text-[22px] font-bold text-white">
            ${raised.toLocaleString()}
          </GMono>
          <Text className="font-mono text-[11px] text-white/60">
            of ${cap.toLocaleString()} raised ({pct.toFixed(1)}%)
          </Text>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <View className="bg-yellow h-full" style={{ width: `${pct}%` }} />
          </View>
        </GCard>

        <GCard className="mt-4 p-4">
          <Text className="font-mono text-[10px] text-ink-mute">YOUR STATUS</Text>
          <Text className="font-display text-ink mt-1 text-[16px] font-bold">
            KYC: {kyc.toUpperCase()}
          </Text>
          <GBody className="mt-1">
            Contributed: ${eligibility?.contributed_usd?.toLocaleString() ?? '0'}
          </GBody>
          {eligibility?.on_waitlist ? (
            <GSticker color="cyan" tilt={-3} className="mt-3">
              ON WAITLIST
            </GSticker>
          ) : null}
        </GCard>

        <GButtonPrimary
          className="mt-6"
          label={ctaLabel}
          disabled={kyc === 'rejected'}
          onPress={openContribute}
        />

        <GCard className="mt-4 p-4" onPress={() => router.push('/(app)/claim')}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-display text-ink text-[15px] font-bold">Claim at TGE</Text>
              <GBody className="mt-0.5">View vested $GAMI and claim in-app</GBody>
            </View>
            <ExternalLink size={20} color="#9A6BFF" />
          </View>
        </GCard>

        <GButtonGhost className="mt-6" label="← BACK" onPress={() => router.back()} />
      </ScrollView>
    </GScreen>
  );
}
