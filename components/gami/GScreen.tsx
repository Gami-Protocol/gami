import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GStatusBar } from './GStatusBar';

interface GScreenProps {
  children: ReactNode;
  /** Show the mock 9:41 status bar. Default true. */
  statusBar?: boolean;
  /** Extra padding classes for the content container. */
  className?: string;
  /** Disable the top purple glow. */
  noTopGlow?: boolean;
}

/**
 * Glow safe-area screen wrapper. Deep base + radial purple glow top and a
 * magenta glow bleeding up from the bottom edge.
 */
export function GScreen({ children, statusBar = true, className, noTopGlow }: GScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-bg flex-1">
      {/* top purple glow */}
      {!noTopGlow && (
        <LinearGradient
          colors={['rgba(110,60,251,0.38)', 'rgba(110,60,251,0.0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
          pointerEvents="none"
        />
      )}
      {/* bottom magenta glow */}
      <LinearGradient
        colors={['rgba(255,61,139,0.0)', 'rgba(255,61,139,0.28)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 320 }}
        pointerEvents="none"
      />
      <View
        className={className}
        style={{
          flex: 1,
          paddingTop: insets.top + (Platform.OS === 'web' ? 12 : 4),
          paddingBottom: insets.bottom,
        }}
      >
        {statusBar && <GStatusBar />}
        {children}
      </View>
    </View>
  );
}
