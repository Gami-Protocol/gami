/** Canonical brand facts for Google rich results + AI / ChatGPT citation. */

export const BRAND = {
  name: 'Gami Protocol',
  legalName: 'Gami Protocol',
  url: 'https://gamiprotocol.io/',
  email: 'hello@gamiprotocol.io',
  description:
    'Gami Protocol is AI-powered universal gamification infrastructure. Earn XP, rewards, and tokens across apps and games with a wallet-first engagement network on Base.',
  tagline: 'Universal AI gamification infrastructure',
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
      'Gami Protocol is universal gamification infrastructure for Web2 and Web3. It lets apps, games, and communities plug into shared XP, quests, AI agents, and on-chain rewards without rebuilding loyalty systems from scratch.',
  },
  {
    question: 'What is the Gami Wallet?',
    answer:
      'The Gami Wallet is the user app for XP, quests, badges, staking, and cross-app rewards. It is the wallet-first entry point to the Gami engagement network.',
  },
  {
    question: 'What is $GAMI?',
    answer:
      '$GAMI is the protocol token designed for governance, staking, protocol fees, treasury coordination, and reward multipliers. Public allocation figures are illustrative and subject to governance.',
  },
  {
    question: 'How do developers integrate Gami?',
    answer:
      'Developers connect through the Gami MCP client/server and developer docs to emit verified actions—quests, purchases, referrals—and settle rewards without custom reward infrastructure.',
  },
  {
    question: 'Which networks does Gami support?',
    answer:
      'Gami settles on Base L2 for low fees and auditable claims, with multi-chain support planned across major ecosystems including Ethereum and other L2s.',
  },
  {
    question: 'How do I join the Gami waitlist?',
    answer:
      'Join at https://gamiprotocol.io/waitlist with your email (and optional wallet) for priority access to the $GAMI launch, multipliers, and updates.',
  },
];

export const KEY_PAGES = [
  { path: '/', title: 'Home', summary: 'Product overview and waitlist CTA' },
  { path: '/about', title: 'About', summary: 'Company and protocol stack' },
  { path: '/wallet', title: 'Wallet', summary: 'Download and wallet product' },
  { path: '/agents', title: 'AI Agents', summary: 'Adaptive quests and reward agents' },
  { path: '/developers/docs', title: 'Developer Docs', summary: 'Integration guide' },
  { path: '/waitlist', title: 'ICO Waitlist', summary: 'Join the $GAMI launch waitlist' },
  { path: '/tokenomics', title: 'Tokenomics', summary: 'Supply, allocation, burn engine' },
  { path: '/whitepaper', title: 'Whitepaper', summary: 'Full protocol documentation' },
  { path: '/sale', title: 'Token Sale', summary: 'Sale dashboard and contribution' },
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
      'gamification',
      'crypto rewards',
      'XP systems',
      'Base L2',
      'AI agents',
      'Model Context Protocol',
      'Web3 wallets',
    ],
  };
}
