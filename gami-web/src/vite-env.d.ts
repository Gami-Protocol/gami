/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_SALE_LIVE?: string;
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_VESTING_ADDRESS?: string;
  readonly VITE_TOKEN_SALE_ADDRESS?: string;
  readonly VITE_GAMI_TOKEN_ADDRESS?: string;
  readonly VITE_USDC_ADDRESS?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_FIAT_ONRAMP_URL?: string;
  readonly VITE_USDT_SWAP_URL?: string;
  readonly VITE_RAMP_HOST_API_KEY?: string;
  readonly VITE_RAMP_ENVIRONMENT?: string;
  readonly VITE_BLOCKED_COUNTRIES?: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string;
  readonly VITE_PERSONA_TEMPLATE_ID?: string;
  readonly VITE_PERSONA_ENVIRONMENT?: string;
  readonly VITE_KYC_PROVIDER?: string;
  readonly VITE_KYC_VERIFICATION_URL?: string;
  readonly VITE_APP_STORE_URL?: string;
  readonly VITE_PLAY_STORE_URL?: string;
  readonly VITE_TESTFLIGHT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
