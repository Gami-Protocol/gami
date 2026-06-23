import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Centralised haptics — no-op on web. */
export const haptics = {
  light() {
    if (Platform.OS === 'web') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium() {
    if (Platform.OS === 'web') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  selection() {
    if (Platform.OS === 'web') return;
    void Haptics.selectionAsync();
  },
  success() {
    if (Platform.OS === 'web') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning() {
    if (Platform.OS === 'web') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
};
