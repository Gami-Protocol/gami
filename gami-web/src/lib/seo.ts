export const SITE_URL = 'https://gamiprotocol.io';
export const SITE_NAME = 'Gami Protocol';
export const DEFAULT_TITLE = 'Gami Protocol — Onchain Loyalty Infrastructure';
export const DEFAULT_DESCRIPTION =
  'Add XP, quests and stablecoin-settled rewards to any app with one SDK. Base-native, gasless, no seed phrase.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export type SeoEntry = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
};

const ROUTES: SeoEntry[] = [
  {
    path: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    path: '/about',
    title: 'About — Gami Protocol',
    description:
      'How Gami Protocol turns user behaviour into XP, quests and stablecoin-settled rewards on Base.',
  },
  {
    path: '/foundation',
    title: 'Gami Foundation — Light-based structure for onchain play',
    description:
      'Gami Foundation stewards the open, light-based layers of Gami Protocol — clear, composable infrastructure for builders and communities.',
  },
  {
    path: '/agents',
    title: 'AI Agents — Gami Protocol',
    description:
      'NOVA reads protocol state and simulates quest and reward outcomes. It does not move funds or act on your behalf.',
  },
  {
    path: '/wallet',
    title: 'Wallet — Gami Protocol',
    description:
      'A Base smart wallet with no seed phrase. Claim your .gami name, earn XP and collect rewards.',
  },
  {
    path: '/wallet/guide',
    title: 'Wallet Guide — Gami Protocol',
    description:
      'Set up your Gami Wallet: sign in with an email or passkey, claim your .gami name, and start earning XP.',
  },
  {
    path: '/app',
    title: 'Wallet — Gami Protocol',
    description:
      'A Base smart wallet with no seed phrase. Claim your .gami name, earn XP and collect rewards.',
  },
  {
    path: '/developers/docs',
    title: 'Developer Docs — Gami Protocol',
    description: 'Integrate Gami Protocol rewards, MCP tools, and gamification APIs into your app.',
  },
  {
    path: '/developers/mcp-client',
    title: 'MCP Client — Gami Protocol',
    description: 'Connect to Gami Protocol with the Model Context Protocol client reference.',
  },
  {
    path: '/developers/mcp-server',
    title: 'MCP Server — Gami Protocol',
    description: 'Access the Gami Protocol MCP server for agentic quests and rewards tooling.',
  },
  {
    path: '/settlement',
    title: 'Settlement — Gami Protocol',
    description:
      'How Gami rewards settle: USDC and EURC on Base, routed not issued. Gami issues no stablecoin and holds no client money.',
  },
  {
    path: '/base',
    title: 'Why Base — Gami Protocol',
    description:
      'Base is the Gami settlement network, chain ID 8453. What is shipped, what is read-only, and what is still roadmap.',
  },
  {
    path: '/status',
    title: 'System Status — Gami Protocol',
    description:
      'Live status for Gami Protocol services, APIs, and waitlist backends.',
  },
  {
    path: '/waitlist',
    title: 'Developer Waitlist — Gami Protocol',
    description:
      'Join the developer waitlist for early access to the Gami SDK, a test environment on Base, and integration support.',
  },
  {
    path: '/waitlist/live',
    title: 'Live Waitlist — Gami Protocol',
    description: 'Watch the live Gami Protocol waitlist counter and subscribe to email alerts.',
  },
  {
    path: '/legal/terms',
    title: 'Terms of Use — Gami Protocol',
    description: 'Terms of use for gamiprotocol.io and Gami Protocol services.',
  },
  {
    path: '/legal/privacy',
    title: 'Privacy Policy — Gami Protocol',
    description: 'How Gami Protocol collects, uses, and protects personal data.',
  },
  {
    path: '/auth',
    title: 'Sign in — Gami Protocol',
    description: 'Sign in to Gami Protocol with email, Google, or phone.',
    noindex: true,
  },
  {
    path: '/login',
    title: 'Sign in — Gami Protocol',
    description: 'Sign in to Gami Protocol with email, Google, or phone.',
    noindex: true,
  },
  {
    path: '/auth/callback',
    title: 'Completing sign-in — Gami Protocol',
    description: 'Finishing authentication redirect for Gami Protocol.',
    noindex: true,
  },
  {
    path: '/callback',
    title: 'Completing sign-in — Gami Protocol',
    description: 'Finishing authentication redirect for Gami Protocol.',
    noindex: true,
  },
  {
    path: '/admin',
    title: 'Waitlist Admin — Gami Protocol',
    description: 'Internal waitlist administration.',
    noindex: true,
  },
];

const BY_PATH = new Map(ROUTES.map((entry) => [entry.path, entry]));

export function seoForPath(pathname: string): SeoEntry {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname || '/';
  return (
    BY_PATH.get(normalized) ?? {
      path: normalized,
      title: 'Page not found — Gami Protocol',
      description: DEFAULT_DESCRIPTION,
      noindex: true,
    }
  );
}

export function absoluteUrl(path: string): string {
  if (path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Only allow same-origin relative paths for post-auth redirects. */
export function safeInternalPath(raw: string | null | undefined, fallback = '/waitlist'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  if (raw.includes('://')) return fallback;
  return raw;
}
