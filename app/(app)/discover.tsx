import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Search, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GScreen, GSticker } from '@/components/gami';
import { CAMPAIGNS, type Campaign } from '@/lib/config';

const CATEGORIES = ['FOR YOU', 'TRENDING', 'GAMING', 'AI', 'FASHION', 'DEFI'];

function CampaignCard({ campaign, featured = false }: { campaign: Campaign; featured?: boolean }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/campaign', params: { campaignId: campaign.id } })
      }
      className={featured ? 'mr-3 w-[292px]' : 'mb-3'}
    >
      <LinearGradient
        colors={campaign.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, minHeight: featured ? 220 : 170, padding: 18 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-2">
            {campaign.sponsored ? (
              <Text className="font-mono text-[9px] tracking-widest text-white/70">SPONSORED</Text>
            ) : null}
            <Text className="font-mono text-[9px] tracking-widest text-white/70">
              {campaign.chain}
            </Text>
          </View>
          <ArrowUpRight size={18} color="#FFFFFF" />
        </View>

        <View className="mt-auto">
          <Text className="font-mono text-[11px] font-bold tracking-[2px] text-white/80">
            {campaign.brand}
          </Text>
          <Text
            className="mt-1 text-[24px] leading-7 font-bold text-white"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            {campaign.title}
          </Text>
          <Text className="mt-2 text-[12px] text-white/75">{campaign.description}</Text>
          <View className="mt-4 flex-row items-end justify-between">
            <View className="flex-row items-center gap-1">
              <Users size={12} color="#FFFFFFB3" />
              <Text className="font-mono text-[10px] text-white/70">
                {campaign.participants} joined
              </Text>
            </View>
            <GSticker color="yellow" tilt={-3}>
              +{campaign.reward} XP
            </GSticker>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function Discover() {
  const [category, setCategory] = useState('FOR YOU');
  const campaigns = useMemo(
    () =>
      category === 'FOR YOU'
        ? CAMPAIGNS
        : CAMPAIGNS.filter((campaign) => campaign.category === category || campaign.sponsored),
    [category],
  );

  return (
    <GScreen>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="px-5 pt-2">
          <Text className="text-ink-mute font-mono text-[11px] tracking-[2px]">DISCOVER</Text>
          <View className="mt-1 flex-row items-center justify-between">
            <Text
              className="text-ink text-[30px] font-bold"
              style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              Find your next move.
            </Text>
            <Pressable className="border-hairline bg-surface h-11 w-11 items-center justify-center rounded-full border">
              <Search size={19} color="#F4F1FF" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 18 }}
        >
          {CATEGORIES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 ${
                item === category ? 'border-purple bg-purple' : 'border-hairline bg-surface'
              }`}
            >
              <Text
                className={`font-mono text-[10px] font-bold ${
                  item === category ? 'text-white' : 'text-ink-dim'
                }`}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="mt-7 px-5">
          <Text className="text-ink font-mono text-[13px] font-bold tracking-wide">
            FEATURED NOW
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12 }}
        >
          {CAMPAIGNS.filter((campaign) => campaign.sponsored).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} featured />
          ))}
        </ScrollView>

        <View className="mt-7 px-5">
          <Text className="text-ink font-mono text-[13px] font-bold tracking-wide">
            {category === 'FOR YOU' ? 'PICKED FOR YOU' : category}
          </Text>
          <View className="mt-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </View>
        </View>
      </ScrollView>
    </GScreen>
  );
}
