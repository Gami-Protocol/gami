import { useRouter } from 'expo-router';
import { ArrowRight, ScanLine, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { GBody, GButtonPrimary, GScreen } from '@/components/gami';

/** Web has no reliable native QR scanner; offer manual entry that mirrors the scan result. */
export default function ScanWeb() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const recipient = value.trim().toLowerCase();
  const ok = /^0x[0-9a-fA-F]{6,}$/.test(recipient) || /^[a-z0-9_]{2,}(\.gami)?$/.test(recipient);

  const goSend = () => {
    if (!ok) return;
    router.replace({ pathname: '/(app)/send', params: { to: recipient } });
  };

  return (
    <GScreen>
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Text className="text-ink-mute font-mono text-[13px] tracking-widest">SCAN</Text>
        <Pressable
          onPress={() => router.back()}
          className="border-hairline bg-surface h-9 w-9 items-center justify-center rounded-full border"
        >
          <X size={18} color="#A09CB8" />
        </Pressable>
      </View>

      <View className="flex-1 items-center px-5">
        <View className="border-hairline bg-surface mt-2 aspect-square w-full items-center justify-center rounded-3xl border px-8">
          <View className="bg-purple/20 border-purple/50 h-16 w-16 items-center justify-center rounded-2xl border">
            <ScanLine size={30} color="#9A6BFF" />
          </View>
          <GBody className="mt-4 text-center">
            QR scanning needs the camera on a device. Paste a handle or address to continue.
          </GBody>
        </View>

        <View className="mt-6 w-full">
          <Text className="text-ink-mute font-mono text-[11px] tracking-widest">RECIPIENT</Text>
          <View className="border-hairline bg-surface mt-2 rounded-2xl border px-4 py-3.5">
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="handle.gami or 0x address"
              placeholderTextColor="#6B6880"
              autoCapitalize="none"
              autoCorrect={false}
              className="text-ink font-mono text-[15px]"
              style={{ fontFamily: 'JetBrainsMono_400Regular' }}
            />
          </View>
        </View>
      </View>

      <View className="px-5 pb-4">
        <GButtonPrimary
          label="CONTINUE"
          disabled={!ok}
          icon={<ArrowRight size={18} color={ok ? '#fff' : '#6B6880'} />}
          onPress={goSend}
        />
      </View>
    </GScreen>
  );
}
