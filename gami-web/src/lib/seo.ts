export const SITE_URL = 'https://gamiprotocol.io';
export const SITE_NAME = 'Gami Protocol';
export const DEFAULT_TITLE = 'Gami Protocol — Universal Gamification Infrastructure';
export const DEFAULT_DESCRIPTION =
  "Earn XP, rewards, and tokens across apps and games using Gami Protocol's AI-powered gamification engine.";
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
      'Learn how Gami Protocol powers wallet-first engagement, XP, and rewards across apps and games on Base.',
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
      'Discover Gami AI agents that run quests, rewards, and engagement loops across the protocol.',
  },
  {
    path: '/wallet',
    title: 'Wallet — Gami Protocol',
    description: 'Download the Gami wallet and earn XP, rewards, and tokens across the ecosystem.',
  },
  {
    path: '/app',
    title: 'Wallet — Gami Protocol',
    description: 'Download the Gami wallet and earn XP, rewards, and tokens across the ecosystem.',
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
    path: '/status',
    title: 'System Status — Gami Protocol',
    description: 'Live status for Gami Protocol services, sale infrastructure, and waitlist backends.',
  },
  {
    path: '/waitlist',
    title: 'GAMI ICO Launchpad — $GAMI Tokenomics & Genesis',
    description:
      'Fixed supply. Community-first. XP-driven. Join the $GAMI ICO waitlist for priority access, multipliers, and governance rights.',
  },
  {
    path: '/waitlist/live',
    title: 'Live Waitlist — Gami Protocol',
    description: 'Watch the live Gami Protocol waitlist counter and subscribe to email alerts.',
  },
  {
    path: '/sale',
    title: 'Token Sale — Gami Protocol',
    description: 'Contribute to the $GAMI token sale on Base with USDC and track your allocation.',
  },
  {
    path: '/sale/contribute',
    title: 'Contribute — Gami Protocol',
    description: 'Join the waitlist and contribute USDC to the $GAMI token sale.',
    noindex: true,
  },
  {
    path: '/sale/kyc',
    title: 'Identity Verification — Gami Protocol',
    description: 'Complete KYC to unlock $GAMI token sale contributions.',
    noindex: true,
  },
  {
    path: '/claim',
    title: 'Claim — Gami Protocol',
    description: 'Claim vested $GAMI after TGE from the vesting vault.',
    noindex: true,
  },
  {
    path: '/tokenomics',
    title: 'Tokenomics — Gami Protocol',
    description: 'Explore $GAMI supply, allocation, burn engine, and vesting design.',
  },
  {
    path: '/whitepaper',
    title: 'Whitepaper — Gami Protocol',
    description: 'Read the Gami Protocol tokenization and engagement network whitepaper.',
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
    path: '/legal/risk',
    title: 'Risk Disclosure — Gami Protocol',
    description: 'Important risk disclosures for participating in the $GAMI token sale.',
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
