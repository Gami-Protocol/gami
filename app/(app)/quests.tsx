import { FlashList } from '@shopify/flash-list';
import { Check, Clock, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { GCard, GConfetti, GMono, GScreen, GSticker } from '@/components/gami';
import { GButtonPrimary } from '@/components/gami/GButton';
import { QUESTS, type Quest } from '@/lib/config';
import { createGamiWallet } from '@/lib/gami-sdk';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

function QuestCard({
  quest,
  claimed,
  onClaim,
}: {
  quest: Quest;
  claimed: boolean;
  onClaim: () => void;
}) {
  return (
    <GCard className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            {quest.novaPick ? (
              <View className="bg-purple/20 flex-row items-center gap-1 rounded-full px-2 py-0.5">
                <Sparkles size={11} color="#B14BFF" />
                <Text className="text-purple-lo font-mono text-[9px] tracking-wide">NOVA PICK</Text>
              </View>
            ) : null}
            <Text className="text-ink-mute font-mono text-[9px] tracking-wide">{quest.tag}</Text>
          </View>
          <Text
            className="font-display text-ink mt-1.5 text-[17px] font-bold"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            {quest.title}
          </Text>
          <Text className="font-body text-ink-dim mt-0.5 text-[13px]">{quest.sub}</Text>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#6B6880" />
              <GMono className="text-ink-mute text-[11px]">{quest.duration}</GMono>
            </View>
          </View>
        </View>
        <GSticker color={claimed ? 'green' : 'magenta'} tilt={-4}>
          +{quest.reward} XP
        </GSticker>
      </View>

      <View className="mt-3">
        {claimed ? (
          <View className="border-green/40 flex-row items-center justify-center gap-2 rounded-2xl border py-3">
            <Check size={16} color="#3DF5A0" strokeWidth={3} />
            <Text className="text-green font-mono text-[13px] font-bold">CLAIMED</Text>
          </View>
        ) : (
          <GButtonPrimary label={`CLAIM +${quest.reward} XP`} onPress={onClaim} />
        )}
      </View>
    </GCard>
  );
}

export default function Quests() {
  const firstQuestClaimed = useOnboardingStore((s) => s.firstQuestClaimed);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [confetti, setConfetti] = useState(false);

  const isClaimed = (id: string) => claimedIds.has(id);

  const claim = async (quest: Quest) => {
    if (claimedIds.has(quest.id)) return;
    setConfetti(true);
    haptics.success();
    const wallet = await createGamiWallet();
    await wallet.awardXP(quest.reward);
    setClaimedIds((prev) => new Set(prev).add(quest.id));
    setTimeout(() => setConfetti(false), 1500);
  };

  const data = useMemo(() => QUESTS, []);

  return (
    <GScreen>
      <GConfetti active={confetti} />
      <View className="px-5 pt-2 pb-2">
        <Text className="text-ink-mute font-mono text-[13px] tracking-widest">QUESTS</Text>
        <Text
          className="font-display text-ink mt-1 text-[28px] font-bold"
          style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
        >
          Stack your XP.
        </Text>
        {!firstQuestClaimed ? (
          <Text className="font-body text-ink-dim mt-1 text-[13px]">
            NOVA tuned these to your vibe.
          </Text>
        ) : null}
      </View>
      <FlashList
        data={data}
        keyExtractor={(q) => q.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <QuestCard quest={item} claimed={isClaimed(item.id)} onClaim={() => claim(item)} />
        )}
      />
    </GScreen>
  );
}
