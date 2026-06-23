import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';

import { GMono } from './Typography';

interface GRingProps {
  size?: number;
  stroke?: number;
  /** 0..1 */
  progress: number;
  centerLabel?: string;
  centerSub?: string;
}

/** Circular gradient-ish progress ring with a mono center label. */
export function GRing({ size = 96, stroke = 8, progress, centerLabel, centerSub }: GRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1E1E2A"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#B14BFF"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          fill="none"
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        {centerLabel ? <GMono className="text-[15px] font-bold">{centerLabel}</GMono> : null}
        {centerSub ? <GMono className="text-ink-mute text-[10px]">{centerSub}</GMono> : null}
      </View>
    </View>
  );
}
