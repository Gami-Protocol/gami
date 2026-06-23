import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { swatchById, type AvatarColorId } from '@/lib/config';

interface GAvatarProps {
  colorId: AvatarColorId;
  monogram: string;
  size?: number;
}

/** Gradient avatar tile with a 2-letter mono monogram. */
export function GAvatar({ colorId, monogram, size = 64 }: GAvatarProps) {
  const swatch = swatchById(colorId);
  return (
    <LinearGradient
      colors={[swatch.hex, swatch.hexTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 0,
      }}
    >
      <View>
        <Text
          className="font-mono font-bold text-white"
          style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: size * 0.34 }}
        >
          {monogram}
        </Text>
      </View>
    </LinearGradient>
  );
}
