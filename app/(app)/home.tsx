import { useRouter } from 'expo-router';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  Compass,
  Repeat2,
  Route,
  Sparkles,
} from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GCard, GConfetti, GMono, GProgressBar, GScreen, GSticker } from '@/components/gami';
import { CAMPAIGNS, type Campaign } from '@/lib/config';
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

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  return (
    <GCard
      className="mb-3"
      onPress={() =>
        router.push({ pathname: '/(app)/campaign', params: { campaignId: campaign.id } })
      }
    >
      <View className="flex-row items-center">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: campaign.colors[0] }}
        >
          <Text className="font-mono text-[11px] font-bold text-white">
            {campaign.brand.slice(0, 2)}
          </Text>
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-ink-mute font-mono text-[9px] tracking-wide">
              {campaign.brand} · {campaign.chain}
            </Text>
            {campaign.sponsored ? (
              <Text className="text-purple-lo font-mono text-[8px]">FEATURED</Text>
            ) : null}
          </View>
          <Text
            className="text-ink mt-1 text-[15px] font-bold"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            {campaign.title}
          </Text>
        </View>
        <View className="items-end gap-2">
          <Text className="text-green font-mono text-[11px] font-bold">+{campaign.reward} XP</Text>
          <ArrowRight size={16} color="#6B6880" />
        </View>
      </View>
    </GCard>
  );
}

export default function Home() {
  const router = useRouter();
  const { handle, xp, spentGami, hideBalances, homeRevealSeen, markHomeRevealSeen, addXP } =
    useOnboardingStore();
  const [stats, setStats] = useState<LevelStats>(currentStats());
  const [confetti, setConfetti] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);

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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <GScreen>
      <GConfetti active={confetti} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}
      >
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-ink-mute font-mono text-[10px] tracking-[2px]">GAMI WALLET</Text>
            <Text
              className="text-ink mt-1 text-[25px] font-bold"
              style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              {greeting}, {handle || 'explorer'}
            </Text>
          </View>
          <Pressable className="border-hairline bg-surface h-11 w-11 items-center justify-center rounded-full border">
            <Bell size={19} color="#F4F1FF" />
            <View className="bg-magenta absolute top-2.5 right-2.5 h-2 w-2 rounded-full" />
          </Pressable>
        </View>

        <GCard gradient glow className="overflow-hidden p-5">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="font-mono text-[10px] tracking-widest text-white/70">
                YOUR ENGAGEMENT ID
              </Text>
              <Text
                className="mt-1 font-mono text-[18px] font-bold text-white"
                style={{ fontFamily: 'JetBrainsMono_700Bold' }}
              >
                @{handle || 'noxx_'}
              </Text>
            </View>
            <GSticker color="yellow" tilt={6}>
              LVL {stats.level}
            </GSticker>
          </View>

          <View className="mt-6 flex-row items-end justify-between">
            <View>
              <Text className="font-mono text-[10px] text-white/70">TOTAL XP</Text>
              <GMono className="text-[28px] font-bold text-white">{xpDisplay}</GMono>
            </View>
            <View className="items-end">
              <Text className="font-mono text-[10px] text-white/70">WALLET</Text>
              <GMono className="text-[18px] font-bold text-white">{balance} GAMI</GMono>
            </View>
          </View>
          <View className="mt-4">
            <GProgressBar value={stats.progress} />
            <Text className="mt-2 text-right font-mono text-[9px] text-white/60">
              {stats.xpToNextLevel.toLocaleString()} XP TO LEVEL {stats.level + 1}
            </Text>
          </View>
        </GCard>

        <View className="mt-5 flex-row justify-between">
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
            icon={<Repeat2 size={20} color="#FF3D8B" />}
            label="SWAP"
            onPress={() => router.push('/(app)/discover')}
          />
          <QuickAction
            icon={<Route size={20} color="#3DD6F5" />}
            label="BRIDGE"
            onPress={() =>
              router.push({
                pathname: '/(app)/campaign',
                params: { campaignId: 'aptos-explorer' },
              })
            }
          />
        </View>

        <GCard
          className="border-green/40 mt-6"
          onPress={() => {
            if (dailyClaimed) return;
            addXP(10);
            setDailyClaimed(true);
            setConfetti(true);
            setTimeout(() => setConfetti(false), 1200);
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="bg-green/10 h-11 w-11 items-center justify-center rounded-2xl">
              <Sparkles size={20} color="#3DF5A0" />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="text-ink text-[15px] font-bold"
                style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
              >
                {dailyClaimed ? 'Daily XP claimed' : 'Daily XP is ready'}
              </Text>
              <Text className="text-ink-mute mt-0.5 text-[12px]">
                {dailyClaimed ? 'Come back tomorrow for more' : 'Tap to keep your streak alive'}
              </Text>
            </View>
            <GSticker color="green" tilt={-3}>
              +10 XP
            </GSticker>
          </View>
        </GCard>

        <View className="mt-7 mb-3 flex-row items-end justify-between">
          <View>
            <Text className="text-ink-mute font-mono text-[10px] tracking-[2px]">FOR YOU</Text>
            <Text
              className="text-ink mt-1 text-[21px] font-bold"
              style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              Today&apos;s campaigns
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/discover')}
            className="flex-row items-center gap-1"
          >
            <Text className="text-purple-lo font-mono text-[10px] font-bold">EXPLORE ALL</Text>
            <Compass size={14} color="#B14BFF" />
          </Pressable>
        </View>
        {CAMPAIGNS.slice(0, 3).map((campaign) => (
          <CampaignRow key={campaign.id} campaign={campaign} />
        ))}
      </ScrollView>
    </GScreen>
  );
}
