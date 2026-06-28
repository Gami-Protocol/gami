import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }]]
      : [];

  return {
    ...config,
    name: 'GAMI',
    slug: 'gami',
    newArchEnabled: true,
    version: process.env.BILT_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'gami',
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSFaceIDUsageDescription:
          'GAMI uses Face ID to secure your wallet and confirm transactions.',
      },
      icon: './assets/icon.png',
      supportsTablet: true,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'com.yourcompany.yourapp',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#6E3CFB',
      },
      package: process.env.BILT_ANDROID_PACKAGE ?? 'com.yourcompany.yourapp',
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
      // Embed the Supabase config into the native build so it is available even
      // if EXPO_PUBLIC_* inlining is missed. Read at runtime via expo-constants.
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      // Privy embedded-wallet auth. Read at runtime via expo-constants as a
      // fallback when EXPO_PUBLIC_* inlining is missed in a native build.
      privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
      privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID,
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0E0E12',
          image: './assets/icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#6E3CFB',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'GAMI uses the camera to scan wallet QR codes for sending $GAMI.',
        },
      ],
      // react-native-passkeys (pulled in by @privy-io/expo) compiles native
      // Swift that uses ASAuthorizationPlatformPublicKeyCredentialProvider,
      // which is only available on iOS 15+. Without pinning the deployment
      // target the Pod fails to compile and `xcodebuild archive` exits 65.
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
          },
        },
      ],
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
