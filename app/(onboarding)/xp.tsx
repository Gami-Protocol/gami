import { useRouter } from 'expo-router';
import { Link2, Share2, Sun, Target, type LucideIcon, UserPlus } from 'lucide-react-native';
import { Text, View } from 'react-native';

import {
  GButtonPrimary,
  GCard,
  GHeading,
  GMono,
  GOnboardHeader,
  GRing,
  GScreen,
  GSticker,
} from '@/components/gami';
import { EARN_RULES } from '@/lib/config';
import { statsFromXP } from '@/lib/gami-sdk';
import { useOnboardingStore } from '@/lib/store';

const ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  target: Target,
  'share-2': Share2,
  'user-plus': UserPlus,
  'link-2': Link2,
};

export default function Xp() {
  const router = useRouter();
  const xp = useOnboardingStore((s) => s.xp);
  const advanceStep = useOnboardingStore((s) => s.advanceStep);
  const stats = statsFromXP(xp);

  return (
    <GScreen>
      <GOnboardHeader step={10} />
      <View className="flex-1 px-6">
        <GHeading size="2xl" className="mt-6">
          How XP{'\n'}works.
        </GHeading>

        <GCard className="mt-6 flex-row items-center gap-5">
          <GRing
            size={96}
            progress={stats.progress}
            centerLabel={`${stats.totalXP}`}
            centerSub="XP"
          />
          <View className="flex-1">
            <GMono className="text-[18px] font-bold">
              LVL {stats.level} → {stats.level + 1}
            </GMono>
            <View className="mt-2">
              <GSticker color="yellow" tilt={-4}>
                START EARNING
              </GSticker>
            </View>
            <GMono className="text-ink-mute mt-2 text-[11px]">
              {stats.xpToNextLevel} XP to next level
            </GMono>
          </View>
        </GCard>

        <Text className="text-ink-mute mt-8 font-mono text-[11px] tracking-widest">
          HOW TO EARN
        </Text>
        <View className="mt-3 gap-2.5">
          {EARN_RULES.map((rule) => {
            const Icon = ICONS[rule.icon] ?? Sun;
            return (
              <View
                key={rule.id}
                className="border-hairline bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
              >
                <Icon size={18} color="#9A6BFF" />
                <Text
                  className="font-body text-ink flex-1 text-[15px]"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {rule.label}
                </Text>
                <GMono className="text-green text-[15px] font-bold">+{rule.value}</GMono>
              </View>
            );
          })}
        </View>
      </View>

      <View className="px-6 pb-6">
        <GButtonPrimary
          label="GOT IT →"
          onPress={() => {
            advanceStep(11);
            router.push('/(onboarding)/permissions');
          }}
        />
      </View>
    </GScreen>
  );
}
