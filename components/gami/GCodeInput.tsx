import { useEffect, useRef } from 'react';
import {
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

const CELLS = 6;
const CELL_KEYS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'] as const;

/**
 * 6-digit OTP entry. Renders 6 boxes backed by a single hidden TextInput so the
 * native numeric keypad + SMS autofill work, while the boxes show progress.
 */
export function GCodeInput({
  value,
  onChangeText,
  onComplete,
  autoFocus = true,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onComplete?: (v: string) => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<TextInput>(null);

  useEffect(() => {
    if (value.length === CELLS) onComplete?.(value);
  }, [value, onComplete]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, CELLS);
    onChangeText(digits);
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && value.length > 0) {
      onChangeText(value.slice(0, -1));
    }
  };

  return (
    <Pressable onPress={() => ref.current?.focus()} className="relative">
      <View className="flex-row justify-between">
        {CELL_KEYS.map((cellKey, i) => {
          const char = value[i] ?? '';
          const active = i === value.length;
          return (
            <View
              key={cellKey}
              className={`bg-surface h-16 w-[14.5%] items-center justify-center rounded-2xl border ${
                char ? 'border-purple' : active ? 'border-magenta' : 'border-hairline'
              }`}
            >
              <Text
                className="text-ink text-[24px]"
                style={{ fontFamily: 'JetBrainsMono_700Bold' }}
              >
                {char}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={ref}
        value={value}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={CELLS}
        // Invisible overlay capturing input; covers the whole row.
        className="absolute inset-0 h-16 w-full text-transparent"
        style={{ opacity: 0 }}
        caretHidden
      />
    </Pressable>
  );
}
