/** Canonical brand facts for Google rich results + AI / ChatGPT citation. */

export const BRAND = {
  name: 'Gami Protocol',
  legalName: 'Gami Protocol',
  url: 'https://gamiprotocol.io/',
  email: 'hello@gamiprotocol.io',
  description:
    'Gami Protocol is onchain loyalty infrastructure. One SDK turns user behaviour into XP, quests and stablecoin-settled rewards on Base.',
  tagline: 'Onchain loyalty infrastructure',
  sameAs: [
    'https://x.com/gamiprotocol',
    'https://t.me/gamiprotocol',
    'https://discord.gg/9Y8vpDAhbD',
  ],
} as const;

export type FaqItem = {
  question: string;
  answer: string;
};

/** High-intent FAQs for Google FAQ rich results and AI answer engines. */
export const SITE_FAQS: FaqItem[] = [
  {
    question: 'What is Gami Protocol?',
    answer:
      'Gami Protocol is onchain loyalty infrastructure. One SDK lets an app turn user behaviour into XP, quests and stablecoin-settled rewards on Base, without building reward infrastructure from scratch.',
  },
  {
    question: 'What is the Gami Wallet?',
    answer:
      'The Gami Wallet is a Base smart wallet, created with a passkey or an email through Privy, with no seed phrase. It holds your .gami name, your XP and badges, and any rewards you collect.',
  },
  {
    question: 'What is XP and is it worth anything?',
    answer:
      'XP is a non-transferable progression record earned by completing quests. It cannot be bought, sold, transferred or redeemed, it is not a financial instrument, and it carries no monetary value.',
  },
  {
    question: 'How do developers integrate Gami?',
    answer:
      'Developers connect through the Gami MCP client and server and the developer docs to emit verified actions — quests, purchases, referrals — and settle rewards without custom reward infrastructure.',
  },
  {
    question: 'Which networks does Gami support?',
    answer:
      'Base (chain ID 8453) is the settlement network. Polygon and Arbitrum are supported read-only. Solana support is on the roadmap and is not yet available.',
  },
  {
    question: 'How are rewards paid out?',
    answer:
      'Rewards settle in USDC and EURC on Base. Gami routes existing regulated stablecoins and does not issue a stablecoin of its own.',
  },
  {
    question: 'How do I join the Gami developer waitlist?',
    answer:
      'Join at https://gamiprotocol.io/waitlist for early access to the Gami SDK, a test environment on Base, and integration support. It is a product waitlist for developers, not an offer or a sale.',
  },
];

export const KEY_PAGES = [
  { path: '/', title: 'Home', summary: 'Product overview and developer waitlist' },
  { path: '/about', title: 'About', summary: 'Company and protocol stack' },
  { path: '/wallet', title: 'Wallet', summary: 'Base smart wallet and .gami name (GNS)' },
  {
    path: '/wallet/guide',
    title: 'Wallet Guide',
    summary: 'Sign in with a passkey, claim a .gami name, earn XP',
  },
  { path: '/agents', title: 'AI Agents', summary: 'NOVA reads protocol state and simulates outcomes' },
  { path: '/developers/docs', title: 'Developer Docs', summary: 'Integration guide' },
  { path: '/settlement', title: 'Settlement', summary: 'How rewards settle in USDC and EURC on Base' },
  { path: '/base', title: 'Why Base', summary: 'Base as the settlement network, chain ID 8453' },
  { path: '/waitlist', title: 'Developer Waitlist', summary: 'Early SDK access and a test environment' },
] as const;

export function buildFaqJsonLd(faqs: FaqItem[] = SITE_FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(pathname: string, title: string) {
  const items: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }> = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: BRAND.url,
    },
  ];

  if (pathname !== '/') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: title.replace(/\s+[—|-].*$/, '').trim() || title,
      item: `https://gamiprotocol.io${pathname}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://gamiprotocol.io/#organization',
    name: BRAND.name,
    legalName: BRAND.legalName,
    url: BRAND.url,
    logo: 'https://gamiprotocol.io/brand/gami-logo-universal.png',
    description: BRAND.description,
    email: BRAND.email,
    sameAs: [...BRAND.sameAs],
    knowsAbout: [
      'loyalty infrastructure',
      'onchain rewards',
      'XP systems',
      'Base',
      'stablecoin settlement',
      'Model Context Protocol',
      'smart wallets',
    ],
  };
}
