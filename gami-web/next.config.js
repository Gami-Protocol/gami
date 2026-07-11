const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo: trace dependencies from the repo root (Expo app + gami-web).
  outputFileTracingRoot: path.join(__dirname, '..'),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optional peer deps pulled in by wagmi/MetaMask SDK on web builds.
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    return config;
  },
};

module.exports = nextConfig;
