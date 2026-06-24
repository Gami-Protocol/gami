import { useRouter } from 'expo-router';
import {
  CalendarCheck,
  Compass,
  Crown,
  Diamond,
  Flame,
  Gem,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  type LucideIcon,
  Lock,
  Milestone,
  Mountain,
  Palette,
  Repeat,
  Rocket,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Vote,
  Waves,
  X,
  Zap,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GBody, GScreen } from '@/components/gami';
import { swatchById } from '@/lib/config';
import { BADGES } from '@/lib/config';
import { currentStats } from '@/lib/gami-sdk';
import { useOnboardingStore } from '@/lib/store';

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  repeat: Repeat,
  flame: Flame,
  gem: Gem,
  image: ImageIcon,
  'user-plus': UserPlus,
  milestone: Milestone,
  vote: Vote,
  'trending-up': TrendingUp,
  palette: Palette,
  waves: Waves,
  crown: Crown,
  layers: Layers,
  'calendar-check': CalendarCheck,
  diamond: Diamond,
  compass: Compass,
  star: Star,
  shield: Shield,
  zap: Zap,
  'graduation-cap': GraduationCap,
  mountain: Mountain,
  rocket: Rocket,
};

export default function Badges() {
  const router = useRouter();
  const { xp } = useOnboardingStore();
  const stats = currentStats();
  const earnedCount = BADGES.filter((b) => xp >= b.unlockXp).length;

  return (
    <GScreen>
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-ink-mute font-mono text-[13px] tracking-widest">BADGES</Text>
          <Text className="text-ink-dim font-mono text-[13px]">
            {earnedCount} / {BADGES.length}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="border-hairline bg-surface h-9 w-9 items-center justify-center rounded-full border"
        >
          <X size={18} color="#A09CB8" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
      >
        <GBody className="px-1">
          Earn XP to unlock the full set. Level {stats.level} · {stats.totalXP.toLocaleString()} XP.
        </GBody>

        <View className="mt-5 flex-row flex-wrap justify-between">
          {BADGES.map((badge) => {
            const earned = xp >= badge.unlockXp;
            const Icon = ICONS[badge.icon] ?? Sparkles;
            const sw = swatchById(badge.color);
            return (
              <View key={badge.id} className="mb-4 w-[31%] items-center">
                <View
                  className="h-[72px] w-[72px] items-center justify-center rounded-2xl border"
                  style={
                    earned
                      ? {
                          backgroundColor: `${sw.hex}22`,
                          borderColor: `${sw.hex}99`,
                          shadowColor: sw.hex,
                          shadowOpacity: 0.5,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: 6,
                        }
                      : { backgroundColor: '#16161E', borderColor: '#2A2A38' }
                  }
                >
                  {earned ? <Icon size={30} color={sw.hex} /> : <Lock size={24} color="#3a3550" />}
                </View>
                <Text
                  className="mt-2 text-center font-mono text-[11px]"
                  style={{ color: earned ? '#E9E7F2' : '#6B6880' }}
                  numberOfLines={1}
                >
                  {badge.label}
                </Text>
                {!earned ? (
                  <Text className="text-ink-mute font-mono text-[9px]">
                    {badge.unlockXp.toLocaleString()} XP
                  </Text>
                ) : (
                  <Text className="text-green font-mono text-[9px]">EARNED</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </GScreen>
  );
}
