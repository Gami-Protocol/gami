import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Bell } from 'lucide-react-native';
import { Platform, Text, View } from 'react-native';

import {
  GBody,
  GButtonPrimary,
  GHeading,
  GOnboardHeader,
  GProgressBar,
  GScreen,
  GSticker,
  GToggleRow,
} from '@/components/gami';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/lib/store';

export default function Permissions() {
  const router = useRouter();
  const {
    notificationsEnabled,
    rewardAlertsEnabled,
    setNotifications,
    setRewardAlerts,
    setOnboarded,
    advanceStep,
  } = useOnboardingStore();

  const finish = () => {
    setOnboarded(true);
    advanceStep(11);
    router.replace('/(app)/home');
  };

  const allow = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotifications(status === Notifications.PermissionStatus.GRANTED);
      } else {
        setNotifications(true);
      }
      haptics.success();
    } catch {
      setNotifications(false);
    }
    finish();
  };

  return (
    <GScreen>
      <GOnboardHeader step={11} />
      <View className="flex-1 px-6">
        <GHeading size="2xl" className="mt-6">
          Stay in{'\n'}the loop.
        </GHeading>
        <GBody className="mt-3">Quest drops, reward alerts, level-ups. We never spam.</GBody>

        <View className="my-10 items-center">
          <GSticker color="yellow" tilt={-8}>
            <View className="bg-yellow h-28 w-24 items-center justify-center rounded-xl">
              <Bell size={44} color="#0E0E12" />
              <View className="bg-magenta absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full">
                <Text className="font-mono text-[12px] font-bold text-white">1</Text>
              </View>
            </View>
          </GSticker>
        </View>

        <View className="gap-2.5">
          <GToggleRow
            title="Push notifications"
            value={notificationsEnabled}
            onValueChange={setNotifications}
            badge={
              <View className="mr-1">
                <GSticker color="green" tilt={0}>
                  RECOMMENDED
                </GSticker>
              </View>
            }
          />
          <GToggleRow
            title="Reward alerts"
            value={rewardAlertsEnabled}
            onValueChange={setRewardAlerts}
          />
        </View>
      </View>

      <View className="px-6 pb-6">
        <GProgressBar value={0.95} className="mb-5" />
        <GButtonPrimary label="ALLOW NOTIFICATIONS" onPress={allow} />
        <View className="mt-4 items-center">
          <Text
            onPress={finish}
            className="font-body text-ink-dim text-[14px]"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            Maybe later
          </Text>
        </View>
      </View>
    </GScreen>
  );
}
