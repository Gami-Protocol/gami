import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="bg-bg flex-1 items-center justify-center gap-4 p-6">
        <Text
          className="font-display text-ink text-[24px] font-bold"
          style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
        >
          Lost in the arcade.
        </Text>
        <Text className="font-body text-ink-dim text-[14px]">This screen doesn&apos;t exist.</Text>
        <Link href="/" className="bg-purple mt-2 rounded-full px-5 py-3">
          <Text className="font-mono text-[13px] font-bold text-white">BACK TO HOME</Text>
        </Link>
      </View>
    </>
  );
}
