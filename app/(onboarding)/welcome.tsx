import { useRouter } from 'expo-router';
import { Bot, Link2, KeyRound, Zap } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  GBackendBanner,
  GBody,
  GButtonPrimary,
  GCard,
  GHeading,
  GOnboardHeader,
  GScreen,
  GSticker,
  useStaggerIn,
} from '@/components/gami';
import { useOnboardingStore } from '@/lib/store';

interface Prop {
  icon: ReactNode;
  label: string;
  sub: string;
}

const PROPS: Prop[] = [
  { icon: <Zap size={20} color="#FFD23D" />, label: 'EARN XP', sub: 'every action counts' },
  { icon: <KeyRound size={20} color="#3DF5A0" />, label: 'SELF-CUSTODY', sub: 'your keys only' },
  { icon: <Link2 size={20} color="#3DD6F5" />, label: 'MULTI-CHAIN', sub: 'Gami · Base · Solana' },
  { icon: <Bot size={20} color="#9A6BFF" />, label: 'MEET NOVA', sub: "your wallet's brain" },
];

function ValueCard({ item, index }: { item: Prop; index: number }) {
  const style = useStaggerIn(index + 1, 70);
  return (
    <Animated.View style={style} className="w-[48%]">
      <GCard className="h-28 justify-between p-4">
        {item.icon}
        <View>
          <Text
            className="text-ink font-mono text-[12px] font-bold tracking-wide"
            style={{ fontFamily: 'JetBrainsMono_700Bold' }}
          >
            {item.label}
          </Text>
          <Text className="font-body text-ink-dim mt-0.5 text-[12px]">{item.sub}</Text>
        </View>
      </GCard>
    </Animated.View>
  );
}

export default function Welcome() {
  const router = useRouter();
  const advanceStep = useOnboardingStore((s) => s.advanceStep);
  const head = useStaggerIn(0, 0);

  return (
    <GScreen>
      <GOnboardHeader step={1} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      >
        <Animated.View style={head}>
          <GSticker color="magenta" tilt={-6} className="mt-4">
            WEB3
          </GSticker>
          <GHeading size="2xl" className="mt-4">
            Your wallet,{'\n'}but make it <GHeading.Accent color="magenta">FUN.</GHeading.Accent>
          </GHeading>
          <GBody className="mt-3">
            Stack XP on everything you do. Earn real rewards. Your keys, your chaos.
          </GBody>
        </Animated.View>

        <View className="mt-8 flex-row flex-wrap justify-between gap-y-3">
          {PROPS.map((p, i) => (
            <ValueCard key={p.label} item={p} index={i} />
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <GBackendBanner className="mb-4" />
        <GButtonPrimary
          label="LET'S GO →"
          onPress={() => {
            advanceStep(2);
            router.push('/(onboarding)/auth');
          }}
        />
      </View>
    </GScreen>
  );
}
