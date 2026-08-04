import path from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Inject Search Console meta into static HTML (required — JS injection is too late). */
function googleSiteVerification(): Plugin {
  return {
    name: 'gami-google-site-verification',
    transformIndexHtml(html, ctx) {
      const mode = ctx.server?.config.mode ?? 'production';
      const env = loadEnv(mode, process.cwd(), '');
      const token = (env.VITE_GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION || '').trim();
      if (!token) return html;
      // Attribute-safe: verification tokens are alphanumeric.
      const safe = token.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safe) return html;
      if (html.includes('name="google-site-verification"')) return html;
      return html.replace(
        '<meta name="robots"',
        `<meta name="google-site-verification" content="${safe}" />\n    <meta name="robots"`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), googleSiteVerification()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './src/shims/empty.ts'),
      'pino-pretty': path.resolve(__dirname, './src/shims/empty.ts'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    // Source maps inflate the deploy artifact (~15MB for the main chunk alone)
    // and are not required for preview CI. Enable locally when debugging bundles.
    sourcemap: false,
  },
  // Ensure Privy Solana optional peers resolve when present (Vercel/Vite builds).
  optimizeDeps: {
    include: [
      '@solana/kit',
      '@solana-program/memo',
      '@solana-program/system',
      '@solana-program/token',
    ],
  },
});
