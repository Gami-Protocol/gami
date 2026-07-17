function read(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Public Privy App ID (safe for the browser). Override with VITE_PRIVY_APP_ID if needed. */
const DEFAULT_PRIVY_APP_ID = 'cmr6honh400ee0cjudyfx9hpt';

export const env = {
  supabaseUrl: () => read('VITE_SUPABASE_URL'),
  supabaseAnonKey: () => read('VITE_SUPABASE_ANON_KEY'),
  /** Firebase web config (public). Project number / messaging sender: 869899204398 */
  firebaseApiKey: () => read('VITE_FIREBASE_API_KEY'),
  firebaseAuthDomain: () => read('VITE_FIREBASE_AUTH_DOMAIN'),
  firebaseProjectId: () => read('VITE_FIREBASE_PROJECT_ID'),
  firebaseStorageBucket: () => read('VITE_FIREBASE_STORAGE_BUCKET'),
  firebaseMessagingSenderId: () => read('VITE_FIREBASE_MESSAGING_SENDER_ID') ?? '869899204398',
  firebaseAppId: () => read('VITE_FIREBASE_APP_ID'),
  firebaseMeasurementId: () => read('VITE_FIREBASE_MEASUREMENT_ID'),
  privyAppId: () => read('VITE_PRIVY_APP_ID') ?? DEFAULT_PRIVY_APP_ID,
  /** WalletConnect Cloud project ID for external mobile/desktop wallets. */
  walletConnectProjectId: () => read('VITE_WALLETCONNECT_PROJECT_ID'),
  /** Explicit launch switch. Leave unset/false until the raise is ready. */
  saleLive: () => read('VITE_SALE_LIVE') === 'true',
  chainId: () => Number(read('VITE_CHAIN_ID') ?? '84532'),
  vestingAddress: () => read('VITE_VESTING_ADDRESS'),
  tokenSaleAddress: () => read('VITE_TOKEN_SALE_ADDRESS'),
  gamiTokenAddress: () => read('VITE_GAMI_TOKEN_ADDRESS'),
  usdcAddress: () => read('VITE_USDC_ADDRESS'),
  fiatOnrampUrl: () => read('VITE_FIAT_ONRAMP_URL'),
  usdtSwapUrl: () => read('VITE_USDT_SWAP_URL'),
  /** Ramp Network Instant host API key for card/fiat → USDC on Base. */
  rampHostApiKey: () => read('VITE_RAMP_HOST_API_KEY'),
  /** `production` (default) or `demo` for Ramp sandbox widget. */
  rampEnvironment: () => {
    const value = read('VITE_RAMP_ENVIRONMENT')?.toLowerCase();
    return value === 'demo' ? 'demo' : 'production';
  },
  blockedCountries: () => read('VITE_BLOCKED_COUNTRIES'),
  supabaseFunctionsUrl: () => read('VITE_SUPABASE_FUNCTIONS_URL'),
  /** Edge/Cloud Function that emails waitlist count alerts (Resend). */
  waitlistNotifyUrl: () => {
    const explicit = read('VITE_WAITLIST_NOTIFY_URL');
    if (explicit) return explicit;
    const functions = read('VITE_SUPABASE_FUNCTIONS_URL');
    if (functions) return `${functions.replace(/\/$/, '')}/waitlist-notify`;
    const supabase = read('VITE_SUPABASE_URL');
    return supabase ? `${supabase.replace(/\/$/, '')}/functions/v1/waitlist-notify` : undefined;
  },
  personaTemplateId: () => read('VITE_PERSONA_TEMPLATE_ID'),
  kycVerificationUrl: () => read('VITE_KYC_VERIFICATION_URL'),
  appStoreUrl: () => read('VITE_APP_STORE_URL'),
  playStoreUrl: () => read('VITE_PLAY_STORE_URL'),
  testflightUrl: () => read('VITE_TESTFLIGHT_URL'),
};
