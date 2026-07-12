function read(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export const env = {
  supabaseUrl: () => read('VITE_SUPABASE_URL'),
  supabaseAnonKey: () => read('VITE_SUPABASE_ANON_KEY'),
  privyAppId: () => read('VITE_PRIVY_APP_ID'),
  chainId: () => Number(read('VITE_CHAIN_ID') ?? '84532'),
  vestingAddress: () => read('VITE_VESTING_ADDRESS'),
  tokenSaleAddress: () => read('VITE_TOKEN_SALE_ADDRESS'),
  gamiTokenAddress: () => read('VITE_GAMI_TOKEN_ADDRESS'),
  usdcAddress: () => read('VITE_USDC_ADDRESS'),
  blockedCountries: () => read('VITE_BLOCKED_COUNTRIES'),
  supabaseFunctionsUrl: () => read('VITE_SUPABASE_FUNCTIONS_URL'),
  personaTemplateId: () => read('VITE_PERSONA_TEMPLATE_ID'),
  appStoreUrl: () => read('VITE_APP_STORE_URL'),
  playStoreUrl: () => read('VITE_PLAY_STORE_URL'),
  testflightUrl: () => read('VITE_TESTFLIGHT_URL'),
};
