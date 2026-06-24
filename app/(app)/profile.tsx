import { useRouter } from 'expo-router';
import {
  Award,
  Bell,
  HelpCircle,
  Settings as SettingsIcon,
  Share2,
  Shield,
  Users,
  Wallet,
} from 'lucide-react-native';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';

import { GAvatar, GCard, GListRow, GMono, GScreen, GSticker } from '@/components/gami';
import { BADGES } from '@/lib/config';
import { currentStats } from '@/lib/gami-sdk';
import { haptics } from '@/lib/haptics';
import { monogram, truncateAddress, useOnboardingStore } from '@/lib/store';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <GMono className="text-[18px] font-bold text-white">{value}</GMono>
      <Text className="mt-0.5 font-mono text-[10px] tracking-wide text-white/70">{label}</Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { handle, avatarId, walletAddress, xp, hideBalances } = useOnboardingStore();
  const stats = currentStats();
  const mono = monogram(handle || 'NX');
  const earnedBadges = BADGES.filter((b) => xp >= b.unlockXp).length;

  const onShare = () => {
    haptics.light();
    void Share.share({
      message: `Join me on Gami Wallet — I'm @${handle || 'noxx_'}, level ${stats.level}. gami.xyz/@${handle || 'noxx_'}`,
    });
  };

  return (
    <GScreen>
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-ink-mute font-mono text-[13px] tracking-widest">PROFILE</Text>
          <GMono className="text-ink-dim text-[13px]">@{handle || 'noxx_'}</GMono>
        </View>
        <SettingsIcon size={20} color="#A09CB8" onPress={() => router.push('/(app)/settings')} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}
      >
        <GCard gradient glow className="p-5" colors={['#FF3D8B', '#B14BFF', '#6E3CFB']}>
          <View className="flex-row items-center gap-4">
            <GAvatar colorId={avatarId} monogram={mono} size={64} />
            <View className="flex-1">
              <GMono className="text-[18px] font-bold text-white">@{handle || 'noxx_'}</GMono>
              <GMono className="mt-0.5 text-[11px] text-white/70">
                {handle || 'noxx_'}.gami · {truncateAddress(walletAddress)}
              </GMono>
            </View>
            <GSticker color="yellow" tilt={6}>
              LVL {stats.level}
            </GSticker>
          </View>

          <View className="mt-5 flex-row">
            <Stat label="XP" value={hideBalances ? '••••' : stats.totalXP.toLocaleString()} />
            <View className="w-px bg-white/20" />
            <Stat label="$GAMI" value={hideBalances ? '••••' : stats.gamiBalance.toFixed(2)} />
            <View className="w-px bg-white/20" />
            <Stat label="RANK" value={`#${stats.rank.toLocaleString()}`} />
          </View>
        </GCard>

        <Text className="text-ink-mute mt-7 font-mono text-[11px] tracking-widest">ACCOUNT</Text>
        <View className="mt-3 gap-2.5">
          <GListRow
            icon={<Shield size={18} color="#9A6BFF" />}
            title="Security & backup"
            chevron
            badge={
              <View className="mr-1">
                <GSticker color="green" tilt={0}>
                  NEW
                </GSticker>
              </View>
            }
            onPress={() => router.push('/(app)/settings')}
          />
          <GListRow
            icon={<Wallet size={18} color="#9A6BFF" />}
            title="Connected wallets"
            meta="1"
            chevron
            onPress={() => router.push('/(app)/receive')}
          />
          <GListRow
            icon={<Bell size={18} color="#9A6BFF" />}
            title="Notifications"
            chevron
            onPress={() => router.push('/(app)/settings')}
          />
          <GListRow
            icon={<Users size={18} color="#9A6BFF" />}
            title="Linked socials"
            chevron
            onPress={onShare}
          />
          <GListRow
            icon={<Share2 size={18} color="#9A6BFF" />}
            title="Share invite link"
            chevron
            onPress={onShare}
          />
          <GListRow
            icon={<HelpCircle size={18} color="#9A6BFF" />}
            title="Help & support"
            chevron
            onPress={() => router.push('/(app)/nova')}
          />
        </View>

        <Pressable
          onPress={() => {
            haptics.light();
            router.push('/(app)/badges');
          }}
          className="mt-6 flex-row items-center justify-center gap-2"
        >
          <Award size={14} color="#9A6BFF" />
          <Text className="text-ink-dim font-mono text-[11px]">
            {earnedBadges} of {BADGES.length} badges · VIEW ALL →
          </Text>
        </Pressable>
      </ScrollView>
    </GScreen>
  );
}
