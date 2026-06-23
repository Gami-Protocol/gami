import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * Gami hexagonal "G" logo. Defaults to a gradient fill; pass color for solid.
 */
export function GLogo({ size = 64, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="glogo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6E3CFB" />
          <Stop offset="0.5" stopColor="#B14BFF" />
          <Stop offset="1" stopColor="#FF3D8B" />
        </LinearGradient>
      </Defs>
      {/* hexagon outline */}
      <Path
        d="M50 6 L86 26 L86 74 L50 94 L14 74 L14 26 Z"
        stroke={color ?? 'url(#glogo)'}
        strokeWidth={9}
        strokeLinejoin="round"
        fill="none"
      />
      {/* the G stroke */}
      <Path
        d="M66 36 C61 31 56 30 50 30 C39 30 31 38 31 50 C31 62 39 70 50 70 C60 70 67 63 67 54 L67 50 L50 50"
        stroke={color ?? 'url(#glogo)'}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
