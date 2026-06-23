import { type ReactNode } from 'react';
import { Switch, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface GToggleRowProps {
  title: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: ReactNode;
  meta?: string;
  disabled?: boolean;
  badge?: ReactNode;
}

export function GToggleRow({
  title,
  value,
  onValueChange,
  icon,
  meta,
  disabled,
  badge,
}: GToggleRowProps) {
  return (
    <View className="border-hairline bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3">
      {icon ? <View className="h-8 w-8 items-center justify-center">{icon}</View> : null}
      <View className="flex-1">
        <Text
          className={cn('font-body text-ink text-[15px] font-medium')}
          style={{ fontFamily: 'Inter_500Medium' }}
        >
          {title}
        </Text>
        {meta ? <Text className="text-ink-mute font-mono text-[11px]">{meta}</Text> : null}
      </View>
      {badge}
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={(v) => {
          haptics.selection();
          onValueChange(v);
        }}
        trackColor={{ false: '#2A2A38', true: '#6E3CFB' }}
        thumbColor="#F4F2FF"
        ios_backgroundColor="#2A2A38"
      />
    </View>
  );
}
