import { Text, View } from 'react-native';

/** Mock iOS status bar (9:41 · signal/wifi/battery glyphs) per the mockups. */
export function GStatusBar() {
  return (
    <View className="h-6 flex-row items-center justify-between px-6">
      <Text className="text-ink font-mono text-[13px] font-semibold">9:41</Text>
      <View className="flex-row items-center gap-1.5">
        <View className="flex-row items-end gap-0.5">
          <View className="bg-ink h-1.5 w-1 rounded-sm" />
          <View className="bg-ink h-2 w-1 rounded-sm" />
          <View className="bg-ink h-2.5 w-1 rounded-sm" />
          <View className="bg-ink h-3 w-1 rounded-sm" />
        </View>
        <View className="border-ink ml-1 h-2.5 w-3.5 rounded-full border" />
        <View className="border-ink ml-0.5 h-3 w-6 rounded-[3px] border p-0.5">
          <View className="bg-ink h-full w-2/3 rounded-[1px]" />
        </View>
      </View>
    </View>
  );
}
