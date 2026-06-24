import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Check, ScanLine, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GBody, GButtonPrimary, GScreen } from '@/components/gami';
import { haptics } from '@/lib/haptics';

/** Pull a Gami recipient (0x address or handle.gami) out of a scanned string. */
function parseRecipient(raw: string): string | null {
  const value = raw.trim();
  const addr = /0x[0-9a-fA-F]{6,}/.exec(value);
  if (addr) return addr[0];
  // gami: / ethereum: style URIs or bare handles
  const handle = /([a-z0-9_]{2,})(?:\.gami)?/i.exec(value.replace(/^[a-z]+:/i, ''));
  if (handle) return handle[1].toLowerCase();
  return null;
}

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const lock = useRef(false);

  const onScanned = useCallback(({ data }: { data: string }) => {
    if (lock.current) return;
    const recipient = parseRecipient(data);
    if (!recipient) return;
    lock.current = true;
    haptics.success();
    setScanned(recipient);
  }, []);

  const goSend = () => {
    if (!scanned) return;
    router.replace({ pathname: '/(app)/send', params: { to: scanned } });
  };

  const reset = () => {
    lock.current = false;
    setScanned(null);
  };

  return (
    <GScreen statusBar={false}>
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
        <View className="border-hairline bg-surface mt-2 aspect-square w-full overflow-hidden rounded-3xl border">
          {permission?.granted ? (
            <View className="flex-1">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : onScanned}
              />
              {/* reticle */}
              <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                <View
                  className={`h-52 w-52 rounded-3xl border-2 ${scanned ? 'border-green' : 'border-white/80'}`}
                />
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <View className="bg-purple/20 border-purple/50 h-16 w-16 items-center justify-center rounded-2xl border">
                <ScanLine size={30} color="#9A6BFF" />
              </View>
              <GBody className="mt-4 text-center">
                {permission?.canAskAgain === false
                  ? 'Camera access is off. Enable it in Settings to scan QR codes.'
                  : 'GAMI needs your camera to scan wallet QR codes.'}
              </GBody>
            </View>
          )}
        </View>

        {scanned ? (
          <View className="mt-6 w-full">
            <View className="border-green/50 bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3.5">
              <Check size={18} color="#3DF5A0" />
              <View className="flex-1">
                <Text className="text-ink-mute font-mono text-[10px] tracking-widest">
                  RECIPIENT
                </Text>
                <Text
                  className="text-ink font-mono text-[14px]"
                  style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                  numberOfLines={1}
                >
                  {scanned}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text className="text-ink-dim mt-6 text-center font-mono text-[12px]">
            Point at a Gami wallet QR to send $GAMI
          </Text>
        )}
      </View>

      <View className="gap-3 px-5 pb-4">
        {scanned ? (
          <>
            <GButtonPrimary label="SEND $GAMI" onPress={goSend} />
            <Pressable onPress={reset} className="items-center py-2">
              <Text className="text-ink-dim font-mono text-[12px]">Scan again</Text>
            </Pressable>
          </>
        ) : permission?.granted ? null : (
          <GButtonPrimary
            label="ENABLE CAMERA"
            onPress={() => void requestPermission()}
            disabled={permission?.canAskAgain === false}
          />
        )}
      </View>
    </GScreen>
  );
}
