import path from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Inject the Search Console meta into static HTML (JS injection is too late —
 * crawlers read the served HTML).
 *
 * This plugin previously "sanitised" the value by stripping every character
 * outside [A-Za-z0-9_-]. That does not make a bad value safe, it makes it
 * *look* valid: a whole sitemap pasted into the environment variable came out
 * as a 900-character run-on string and shipped to production, where it both
 * broke verification and published the site's full route inventory — including
 * routes that had been withdrawn — in a tag nobody audits.
 *
 * So: validate, never launder. A Search Console token is short, opaque, and
 * contains no whitespace, URLs or markup. Anything else is a misconfiguration
 * and the tag is omitted rather than repaired. Omitting it only costs
 * verification, which an invalid value had already lost; injecting it leaks.
 */
const MAX_VERIFICATION_TOKEN_LENGTH = 100;

function isVerificationTokenShaped(value: string): boolean {
  if (!value || value.length > MAX_VERIFICATION_TOKEN_LENGTH) return false;
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function googleSiteVerification(): Plugin {
  return {
    name: 'gami-google-site-verification',
    transformIndexHtml(html, ctx) {
      const mode = ctx.server?.config.mode ?? 'production';
      const env = loadEnv(mode, process.cwd(), '');
      const token = (env.VITE_GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION || '').trim();
      if (!token) return html;

      if (!isVerificationTokenShaped(token)) {
        // Loud, and on stderr: this is a misconfiguration someone must fix in
        // the deployment environment. The build continues without the tag so a
        // bad value can never reach production.
        console.error(
          '\n[google-site-verification] REFUSING TO INJECT.\n' +
            `  VITE_GOOGLE_SITE_VERIFICATION is ${token.length} characters and is not a\n` +
            '  verification token. Search Console issues a short opaque string; this\n' +
            '  looks like a URL, a sitemap, or pasted markup.\n' +
            '  The meta tag has been omitted. Set the variable to the real token, or\n' +
            '  unset it, in the deployment environment.\n',
        );
        return html;
      }

      if (html.includes('name="google-site-verification"')) return html;
      return html.replace(
        '<meta name="robots"',
        `<meta name="google-site-verification" content="${token}" />\n    <meta name="robots"`,
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
      // Privy's optional crypto-onramp peer — gami-web doesn't use it, but its
      // own import of the (also-absent) @stripe/stripe-js crashes Vite's dep
      // scanner outright if @stripe/crypto is resolvable from anywhere on the
      // filesystem (e.g. hoisted into a parent directory's node_modules).
      '@stripe/crypto': path.resolve(__dirname, './src/shims/empty.ts'),
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
