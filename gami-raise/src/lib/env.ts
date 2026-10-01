function read(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

const DEFAULT_PRIVY_APP_ID = 'cmr6honh400ee0cjudyfx9hpt';

export const env = {
  privyAppId: () => read('NEXT_PUBLIC_PRIVY_APP_ID') ?? DEFAULT_PRIVY_APP_ID,
  chainId: () => Number(read('NEXT_PUBLIC_CHAIN_ID') ?? '84532'),
  appUrl: () => read('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000',
  saleLive: () => read('NEXT_PUBLIC_SALE_LIVE') === 'true',
  walletConnectProjectId: () => read('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'),
  tokenSaleAddress: () => read('NEXT_PUBLIC_TOKEN_SALE_ADDRESS'),
  usdcAddress: () => read('NEXT_PUBLIC_USDC_ADDRESS'),
  gamiTokenAddress: () => read('NEXT_PUBLIC_GAMI_TOKEN_ADDRESS'),
  vestingAddress: () => read('NEXT_PUBLIC_VESTING_ADDRESS'),
  supabaseUrl: () => read('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
};
