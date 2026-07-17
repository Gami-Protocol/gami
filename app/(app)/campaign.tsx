import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, ChevronRight, Globe2, Share2, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GButtonPrimary, GCard, GConfetti, GScreen, GSticker } from '@/components/gami';
import { campaignById } from '@/lib/config';
import { type EnvelopeStatus, questComplete } from '@/lib/gami-sdk';

export default function CampaignPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const campaignId = typeof params.campaignId === 'string' ? params.campaignId : undefined;
  const campaign = campaignById(campaignId ?? '');
  const [status, setStatus] = useState<EnvelopeStatus | 'submitting' | null>(null);
  const [confetti, setConfetti] = useState(false);

  if (!campaign) {
    return (
      <GScreen>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-ink text-lg">Campaign unavailable.</Text>
          <Pressable onPress={() => router.back()} className="mt-4">
            <Text className="text-purple-lo font-mono">GO BACK</Text>
          </Pressable>
        </View>
      </GScreen>
    );
  }

  const claim = () => {
    if (status) return;
    setStatus('submitting');
    questComplete(campaign.id, campaign.reward, (envelope) => {
      setStatus(envelope.status);
      if (envelope.status === 'settled') {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1500);
      }
    });
  };

  const buttonLabel =
    status === 'settled'
      ? `CLAIMED · +${campaign.reward} XP`
      : status
        ? 'VERIFYING ON-CHAIN…'
        : `COMPLETE CAMPAIGN · +${campaign.reward} XP`;

  return (
    <GScreen>
      <GConfetti active={confetti} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient
          colors={campaign.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/20"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-black/20">
              <Share2 size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="mt-20">
            <View className="flex-row items-center gap-2">
              {campaign.sponsored ? (
                <Text className="font-mono text-[9px] tracking-[2px] text-white/70">SPONSORED</Text>
              ) : null}
              <Text className="font-mono text-[9px] tracking-[2px] text-white/70">
                {campaign.chain}
              </Text>
            </View>
            <Text className="mt-3 font-mono text-[12px] font-bold tracking-[3px] text-white/80">
              {campaign.brand}
            </Text>
            <Text
              className="mt-1 text-[36px] leading-10 font-bold text-white"
              style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              {campaign.title}
            </Text>
            <Text className="mt-3 max-w-[320px] text-[14px] leading-5 text-white/80">
              {campaign.description}
            </Text>
            <View className="mt-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Users size={14} color="#FFFFFFB3" />
                <Text className="font-mono text-[11px] text-white/70">
                  {campaign.participants} joined
                </Text>
              </View>
              <GSticker color="yellow" tilt={-4}>
                +{campaign.reward} XP
              </GSticker>
            </View>
          </View>
        </LinearGradient>

        <View className="px-5 pt-6">
          <Text className="text-ink font-mono text-[12px] font-bold tracking-[2px]">
            CAMPAIGN TASKS
          </Text>
          <GCard className="mt-3 p-0">
            {campaign.tasks.map((task, index) => (
              <Pressable
                key={task}
                className={`flex-row items-center px-4 py-4 ${
                  index < campaign.tasks.length - 1 ? 'border-hairline border-b' : ''
                }`}
              >
                <View className="border-purple/50 bg-purple/10 h-7 w-7 items-center justify-center rounded-full border">
                  <Text className="text-purple-lo font-mono text-[10px] font-bold">
                    {index + 1}
                  </Text>
                </View>
                <Text className="text-ink ml-3 flex-1 text-[14px]">{task}</Text>
                <ChevronRight size={17} color="#6B6880" />
              </Pressable>
            ))}
          </GCard>

          <GCard className="mt-4">
            <View className="flex-row items-center">
              <View className="bg-cyan/10 h-10 w-10 items-center justify-center rounded-xl">
                <Globe2 size={19} color="#3DD6F5" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-ink text-[14px] font-semibold">Cross-chain, handled</Text>
                <Text className="text-ink-mute mt-0.5 text-[12px]">
                  Gami finds the best route. You only approve.
                </Text>
              </View>
              <Check size={17} color="#3DF5A0" />
            </View>
          </GCard>

          <View className="mt-6">
            <GButtonPrimary label={buttonLabel} onPress={claim} disabled={Boolean(status)} />
          </View>
        </View>
      </ScrollView>
    </GScreen>
  );
}
