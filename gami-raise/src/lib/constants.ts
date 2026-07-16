export const BRAND = {
  purple: '#6C3BFF',
  blue: '#3B82F6',
  black: '#050505',
  white: '#F7F7F8',
} as const;

export const RAISE = {
  hardCapUsd: 2_160_000,
  minContributionUsd: 500,
  perWalletCapUsd: 2_500,
  priceUsd: 0.012,
  tgeUnlockBps: 1500,
  vestingDays: 365,
} as const;

export const NAV_LINKS = [
  { href: '/raise', label: 'Raise' },
  { href: '/token', label: 'Token' },
  { href: '/ico', label: 'ICO' },
  { href: '/tge', label: 'TGE' },
  { href: '/investors', label: 'Investors' },
  { href: '/partners', label: 'Partners' },
  { href: '/developers', label: 'Developers' },
  { href: '/community', label: 'Community' },
  { href: '/docs', label: 'Docs' },
] as const;

export const RAISE_STEPS = [
  { id: 'connect', title: 'Connect wallet', detail: 'Privy embedded or external wallet' },
  { id: 'signin', title: 'Sign in', detail: 'Email, Google, Apple, X, Discord, GitHub' },
  { id: 'verify', title: 'Verify email', detail: 'Confirm ownership of your account email' },
  { id: 'profile', title: 'Complete profile', detail: 'Identity details for allocation records' },
  { id: 'eligibility', title: 'Eligibility checks', detail: 'Geo, KYC, and phase whitelist' },
  { id: 'register', title: 'Investor registration', detail: 'Intent, accreditation, and disclosure' },
  { id: 'referral', title: 'Referral generation', detail: 'Share code and earn XP' },
  { id: 'dashboard', title: 'User dashboard', detail: 'Track allocation, XP, and TGE readiness' },
] as const;

export const TOKENOMICS = [
  { bucket: 'Community & rewards', pct: 50 },
  { bucket: 'Team & advisors', pct: 20 },
  { bucket: 'Strategic partners', pct: 20 },
  { bucket: 'Treasury & reserves', pct: 10 },
] as const;
