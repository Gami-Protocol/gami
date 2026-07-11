/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_VESTING_ADDRESS?: string;
  readonly VITE_TOKEN_SALE_ADDRESS?: string;
  readonly VITE_GAMI_TOKEN_ADDRESS?: string;
  readonly VITE_USDC_ADDRESS?: string;
  readonly VITE_BLOCKED_COUNTRIES?: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string;
  readonly VITE_PERSONA_TEMPLATE_ID?: string;
  readonly VITE_APP_STORE_URL?: string;
  readonly VITE_PLAY_STORE_URL?: string;
  readonly VITE_TESTFLIGHT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
