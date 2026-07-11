import { useRouter } from 'expo-router';
import { ArrowDown, ArrowUp, Coins, Gift, Layers, ScanLine, Share2, Target } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GBody, GCard, GConfetti, GMono, GScreen, GSticker } from '@/components/gami';
import { createGamiWallet, currentStats, type LevelStats } from '@/lib/gami-sdk';
import { useOnboardingStore } from '@/lib/store';

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-2">
      <View className="border-hairline bg-surface h-14 w-14 items-center justify-center rounded-2xl border">
        {icon}
      </View>
      <Text className="text-ink-dim font-mono text-[11px]">{label}</Text>
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const {
    handle,
    xp,
    spentGami,
    hideBalances,
    homeRevealSeen,
    markHomeRevealSeen,
    firstQuestClaimed,
  } = useOnboardingStore();
  const [stats, setStats] = useState<LevelStats>(currentStats());
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    let mounted = true;
    void createGamiWallet().then(async (wallet) => {
      const s = await wallet.checkMyLevel();
      if (mounted) setStats(s);
      unsub = wallet.subscribeToLevelUps(() => {
        if (mounted) setStats(currentStats());
      });
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // keep stats in sync with store xp / spend
  useEffect(() => {
    setStats(currentStats());
  }, [xp, spentGami]);

  useEffect(() => {
    if (!homeRevealSeen) {
      setConfetti(true);
      markHomeRevealSeen();
      const t = setTimeout(() => setConfetti(false), 1600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [homeRevealSeen, markHomeRevealSeen]);

  const balance = hideBalances ? '••••' : stats.gamiBalance.toFixed(2);
  const xpDisplay = hideBalances ? '••••' : stats.totalXP.toLocaleString();

  return (
    <GScreen>
      <GConfetti active={confetti} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}
      >
        <GCard gradient glow className="overflow-hidden p-5">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="font-mono text-[11px] tracking-widest text-white/70">HEY,</Text>
              <Text
                className="font-mono text-[20px] font-bold text-white"
                style={{ fontFamily: 'JetBrainsMono_700Bold' }}
              >
                @{handle || 'noxx_'}
              </Text>
            </View>
            <GSticker color="yellow" tilt={6}>
              LVL {stats.level}
            </GSticker>
          </View>

          <Text
            className="font-display mt-5 text-[34px] font-bold text-white"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            WELCOME
          </Text>

          <View className="mt-4 flex-row items-end justify-between">
            <View>
              <Text className="font-mono text-[11px] text-white/70">$GAMI</Text>
              <GMono className="text-[24px] font-bold text-white">{balance}</GMono>
              {stats.balanceSource === 'chain' ? (
                <Text className="font-mono text-[9px] text-green">on-chain</Text>
              ) : null}
            </View>
            <View className="items-end">
              <View className="flex-row items-center gap-1">
                <View className="bg-green h-2 w-2 rounded-full" />
                <Text className="font-mono text-[10px] text-white/70">live</Text>
              </View>
              <Text className="font-mono text-[11px] text-white/70">XP / Points</Text>
              <GMono className="text-[20px] font-bold text-white">{xpDisplay}</GMono>
            </View>
          </View>
          {stats.claimableGami > 0 ? (
            <Pressable onPress={() => router.push('/(app)/claim')} className="mt-4 flex-row items-center gap-2">
              <Gift size={14} color="#FFD23D" />
              <Text className="font-mono text-[11px] text-yellow">
                {stats.claimableGami.toFixed(2)} GAMI claimable →
              </Text>
            </Pressable>
          ) : null}
        </GCard>

        {/* quick actions */}
        <View className="mt-6 flex-row justify-between">
          <QuickAction
            icon={<ArrowUp size={20} color="#9A6BFF" />}
            label="SEND"
            onPress={() => router.push('/(app)/send')}
          />
          <QuickAction
            icon={<ArrowDown size={20} color="#3DF5A0" />}
            label="RECEIVE"
            onPress={() => router.push('/(app)/receive')}
          />
          <QuickAction
            icon={<Target size={20} color="#FF3D8B" />}
            label="QUESTS"
            onPress={() => router.push('/(app)/quests')}
          />
          <QuickAction
            icon={<ScanLine size={20} color="#3DD6F5" />}
            label="SCAN"
            onPress={() => router.push('/(app)/scan')}
          />
        </View>

        {/* first quest */}
        {!firstQuestClaimed ? (
          <GCard className="border-green/50 mt-6" onPress={() => router.push('/(app)/quests')}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="font-display text-ink text-[16px] font-bold"
                  style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                >
                  First quest
                </Text>
                <GBody className="mt-0.5">Finish First Steps → +250 XP</GBody>
              </View>
              <GSticker color="green" tilt={-4}>
                +250 XP
              </GSticker>
            </View>
          </GCard>
        ) : (
          <GCard className="mt-6" onPress={() => router.push('/(app)/quests')}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="font-display text-ink text-[16px] font-bold"
                  style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                >
                  Active quests
                </Text>
                <GBody className="mt-0.5">NOVA picked 3 quests for your vibe</GBody>
              </View>
              <Target size={22} color="#9A6BFF" />
            </View>
          </GCard>
        )}

        {/* ICO / sale */}
        <GCard className="mt-4" onPress={() => router.push('/(app)/sale')}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="font-display text-ink text-[16px] font-bold"
                style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
              >
                Token sale
              </Text>
              <GBody className="mt-0.5">KYC, contribute USDC, track the raise</GBody>
            </View>
            <Coins size={22} color="#FFD23D" />
          </View>
        </GCard>

        {/* Referral */}
        <GCard className="mt-4" onPress={() => router.push('/(app)/referral')}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="font-display text-ink text-[16px] font-bold"
                style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
              >
                Refer & earn
              </Text>
              <GBody className="mt-0.5">Share your code · +100 XP per invite</GBody>
            </View>
            <Share2 size={22} color="#FF3D8B" />
          </View>
        </GCard>

        {/* stash / badges */}
        <GCard className="mt-4" onPress={() => router.push('/(app)/badges')}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="font-display text-ink text-[16px] font-bold"
                style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
              >
                Your stash
              </Text>
              <GBody className="mt-0.5">Badges, stickers & collectibles</GBody>
            </View>
            <Layers size={22} color="#3DD6F5" />
          </View>
        </GCard>
      </ScrollView>
    </GScreen>
  );
}
