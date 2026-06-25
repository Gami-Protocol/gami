import { WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { hasBackend, pingBackend } from '@/lib/supabase';

const YELLOW = '#FFD23D';

/**
 * Warns when the Gami backend can't be reached from this build, so auth
 * failures never hide silently. Shows immediately when keys aren't embedded
 * (`hasBackend` is false), and otherwise after a live reachability probe fails.
 * Renders nothing while reachable.
 */
export function GBackendBanner({ className }: { className?: string }) {
  // null = checking, true = reachable, false = unreachable
  const [reachable, setReachable] = useState<boolean | null>(hasBackend ? null : false);

  useEffect(() => {
    if (!hasBackend) return () => {};
    let alive = true;
    void pingBackend().then((ok) => {
      if (alive) setReachable(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (reachable !== false) return null;

  const detail = hasBackend
    ? "We can't reach the Gami backend right now. Check your connection and try again."
    : "This build can't reach the Gami backend. Codes won't arrive — reinstall the latest build.";

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      className={className}
      accessibilityRole="alert"
    >
      <View className="border-yellow/40 bg-yellow/10 flex-row items-start gap-3 rounded-2xl border px-4 py-3">
        <WifiOff size={18} color={YELLOW} style={{ marginTop: 1 }} />
        <View className="flex-1">
          <Text
            className="text-yellow font-mono text-[11px] font-bold tracking-widest"
            style={{ fontFamily: 'JetBrainsMono_700Bold' }}
          >
            BACKEND UNREACHABLE
          </Text>
          <Text className="text-ink-dim font-body mt-1 text-[12px] leading-[17px]">{detail}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
