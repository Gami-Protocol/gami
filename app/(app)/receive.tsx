import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Check, Copy, QrCode, Share2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';

import { GBody, GButtonGhost, GButtonPrimary, GCard, GMono, GScreen } from '@/components/gami';
import { createGamiWallet } from '@/lib/gami-sdk';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

export default function Receive() {
  const router = useRouter();
  const { handle, walletAddress } = useOnboardingStore();
  const [address, setAddress] = useState(walletAddress ?? '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) {
      void createGamiWallet().then((w) => setAddress(w.address));
    }
  }, [address]);

  const onCopy = async () => {
    haptics.success();
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onShare = () => {
    haptics.light();
    void Share.share({
      message: `Send me $GAMI → ${handle || 'noxx_'}.gami (${address})`,
    });
  };

  return (
    <GScreen>
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Text className="text-ink-mute font-mono text-[13px] tracking-widest">RECEIVE</Text>
        <Pressable
          onPress={() => router.back()}
          className="border-hairline bg-surface h-9 w-9 items-center justify-center rounded-full border"
        >
          <X size={18} color="#A09CB8" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}
      >
        <GCard gradient glow className="items-center p-6">
          <View className="h-44 w-44 items-center justify-center rounded-2xl bg-white">
            <QrCode size={150} color="#0E0E12" />
          </View>
          <GMono className="mt-5 text-[16px] font-bold text-white">{handle || 'noxx_'}.gami</GMono>
          <Text className="mt-1 font-mono text-[11px] text-white/70">your Gami handle</Text>
        </GCard>

        <Text className="text-ink-mute mt-6 font-mono text-[11px] tracking-widest">
          WALLET ADDRESS
        </Text>
        <Pressable onPress={onCopy}>
          <View className="border-hairline bg-surface mt-2 flex-row items-center justify-between rounded-2xl border px-4 py-4">
            <Text
              className="text-ink flex-1 pr-3 font-mono text-[13px]"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
              numberOfLines={1}
            >
              {address || 'generating…'}
            </Text>
            {copied ? <Check size={18} color="#3DF5A0" /> : <Copy size={18} color="#9A6BFF" />}
          </View>
        </Pressable>

        <GBody className="mt-4 text-center">
          Share your handle or address to get paid in $GAMI on the gami-1 network.
        </GBody>

        <View className="mt-6 gap-3">
          <GButtonPrimary
            label={copied ? 'COPIED' : 'COPY ADDRESS'}
            icon={copied ? <Check size={18} color="#fff" /> : <Copy size={18} color="#fff" />}
            onPress={() => void onCopy()}
          />
          <GButtonGhost
            label="Share"
            icon={<Share2 size={16} color="#E9E7F2" />}
            onPress={onShare}
          />
        </View>
      </ScrollView>
    </GScreen>
  );
}
