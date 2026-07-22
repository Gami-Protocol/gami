import { createAdminClient, createContextClient } from '@supabase/server/core';
import type { SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null | undefined;
let publishableClient: SupabaseClient | null | undefined;

function readServerKeys() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const jwksUrl = process.env.SUPABASE_JWKS_URL;

  return { url, publishableKey, secretKey, jwksUrl };
}

function envOverride() {
  const { url, publishableKey, secretKey, jwksUrl } = readServerKeys();
  if (!url) return null;

  const publishableKeys: Record<string, string> = {};
  const secretKeys: Record<string, string> = {};
  if (publishableKey) publishableKeys.default = publishableKey;
  if (secretKey) secretKeys.default = secretKey;

  return {
    url,
    publishableKeys,
    secretKeys,
    jwks: jwksUrl ? new URL(jwksUrl) : null,
  };
}

/** RLS-bypassing admin client for trusted server routes. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;

  const env = envOverride();
  const { secretKey } = readServerKeys();
  if (!env) {
    adminClient = null;
    return adminClient;
  }

  try {
    if (secretKey) {
      adminClient = createAdminClient({ env });
    } else if (Object.keys(env.publishableKeys).length > 0) {
      // Publishable-only until SUPABASE_SECRET_KEY is configured.
      adminClient = createContextClient({ env });
    } else {
      adminClient = null;
    }
  } catch {
    adminClient = null;
  }
  return adminClient;
}

export function getSupabasePublishable(): SupabaseClient | null {
  if (publishableClient !== undefined) return publishableClient;

  const env = envOverride();
  if (!env || Object.keys(env.publishableKeys).length === 0) {
    publishableClient = null;
    return publishableClient;
  }

  try {
    publishableClient = createContextClient({ env });
  } catch {
    publishableClient = null;
  }
  return publishableClient;
}

export function isSupabaseConfigured() {
  return getSupabaseAdmin() !== null || getSupabasePublishable() !== null;
}
