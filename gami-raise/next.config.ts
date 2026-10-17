import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ['@privy-io/react-auth', '@privy-io/wagmi'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'pino-pretty': 'commonjs pino-pretty' }];
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': false,
      '@stripe/crypto': false,
      '@farcaster/mini-app-solana': false,
    };
    return config;
  },
};

export default nextConfig;
