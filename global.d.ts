declare module '*.css';

// react-native-maps is intentionally NOT installed (the app uses the Leaflet
// WebView fallback in components/MapView.tsx, and keeping the native pod out of
// the iOS build avoids App Store archive failures). This ambient declaration lets
// the dynamic import in MapView.tsx type-check; at runtime the module resolves to
// an empty object (see metro.config.cjs) and the component renders the fallback.
declare module 'react-native-maps' {
  import type { ComponentType } from 'react';

  const MapView: ComponentType<Record<string, unknown>>;
  export const Marker: ComponentType<Record<string, unknown>>;
  export const Polyline: ComponentType<Record<string, unknown>>;
  export const Polygon: ComponentType<Record<string, unknown>>;
  export const Circle: ComponentType<Record<string, unknown>>;
  export default MapView;
}
