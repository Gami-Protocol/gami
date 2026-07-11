/**
 * App configuration — earn rules, interests, avatar palette.
 * Screens pull values from here rather than hardcoding copy.
 */

export interface EarnRule {
  id: string;
  label: string;
  value: number;
  icon: string;
}

export const EARN_RULES: EarnRule[] = [
  { id: 'daily', label: 'Daily login', value: 10, icon: 'sun' },
  { id: 'quest', label: 'Complete a quest', value: 250, icon: 'target' },
  { id: 'share', label: 'Share content', value: 50, icon: 'share-2' },
  { id: 'refer', label: 'Refer a friend', value: 500, icon: 'user-plus' },
  { id: 'onchain', label: 'On-chain action', value: 25, icon: 'link-2' },
];

export interface Interest {
  id: string;
  label: string;
  color: AvatarColorId;
}

export const INTERESTS: Interest[] = [
  { id: 'gaming', label: 'GAMING', color: 'magenta' },
  { id: 'defi', label: 'DEFI', color: 'cyan' },
  { id: 'nfts', label: 'NFTs', color: 'purple' },
  { id: 'trading', label: 'TRADING', color: 'green' },
  { id: 'daos', label: 'DAOs', color: 'yellow' },
  { id: 'creator', label: 'CREATOR', color: 'magenta' },
  { id: 'memes', label: 'MEMES', color: 'green' },
  { id: 'privacy', label: 'PRIVACY', color: 'cyan' },
  { id: 'ai', label: 'AI', color: 'purple' },
  { id: 'music', label: 'MUSIC', color: 'yellow' },
  { id: 'sports', label: 'SPORTS', color: 'magenta' },
  { id: 'learn', label: 'LEARN', color: 'cyan' },
];

export type AvatarColorId = 'magenta' | 'purple' | 'cyan' | 'green' | 'yellow' | 'slate';

const AVATAR_COLOR_IDS: readonly AvatarColorId[] = [
  'magenta',
  'purple',
  'cyan',
  'green',
  'yellow',
  'slate',
];

/** Narrow an unknown string to AvatarColorId, falling back to 'slate'. */
export function toAvatarColorId(v: string): AvatarColorId {
  const found = AVATAR_COLOR_IDS.find((id): id is AvatarColorId => id === v);
  return found ?? 'slate';
}

export interface AvatarSwatch {
  id: AvatarColorId;
  /** Tailwind-ish hex for gradient/solid fills */
  hex: string;
  hexTo: string;
}

export const AVATAR_SWATCHES: AvatarSwatch[] = [
  { id: 'magenta', hex: '#FF3D8B', hexTo: '#B14BFF' },
  { id: 'purple', hex: '#6E3CFB', hexTo: '#B14BFF' },
  { id: 'cyan', hex: '#3DD6F5', hexTo: '#6E3CFB' },
  { id: 'green', hex: '#3DF5A0', hexTo: '#3DD6F5' },
  { id: 'yellow', hex: '#FFD23D', hexTo: '#FF3D8B' },
  { id: 'slate', hex: '#6B6880', hexTo: '#2A2A38' },
];

export function swatchById(id: AvatarColorId): AvatarSwatch {
  return AVATAR_SWATCHES.find((s) => s.id === id) ?? AVATAR_SWATCHES[1];
}

export type NovaTone = 'shy' | 'chill' | 'hype';

const NOVA_TONES: readonly NovaTone[] = ['shy', 'chill', 'hype'];

/** Narrow an unknown string to NovaTone, falling back to 'chill'. */
export function toNovaTone(v: string): NovaTone {
  const found = NOVA_TONES.find((t): t is NovaTone => t === v);
  return found ?? 'chill';
}

/** Brand gradient used across hero elements (135deg). */
export const BRAND_GRADIENT = ['#6E3CFB', '#B14BFF', '#FF3D8B'] as const;

export interface Campaign {
  id: string;
  brand: string;
  title: string;
  description: string;
  reward: number;
  chain: string;
  category: string;
  participants: string;
  sponsored?: boolean;
  colors: readonly [string, string];
  tasks: readonly string[];
}

/**
 * Campaigns are the wallet's discovery layer. In production these come from
 * the campaign marketplace; the local catalog keeps the product useful while
 * that service is unavailable.
 */
export const CAMPAIGNS: Campaign[] = [
  {
    id: 'summer-run',
    brand: 'NIKE',
    title: 'Summer Run Challenge',
    description: 'Move, collect and unlock a limited digital reward.',
    reward: 750,
    chain: 'BASE',
    category: 'FASHION',
    participants: '12.8K',
    sponsored: true,
    colors: ['#FF5F35', '#B21F1F'],
    tasks: ['Watch the campaign film', 'Join the run club', 'Mint the finish badge'],
  },
  {
    id: 'aptos-explorer',
    brand: 'APTOS',
    title: 'Explore Aptos',
    description: 'Bridge once and discover a new on-chain ecosystem.',
    reward: 1000,
    chain: 'APTOS',
    category: 'TRENDING',
    participants: '8.4K',
    sponsored: true,
    colors: ['#00C2A8', '#00796B'],
    tasks: ['Learn about Aptos', 'Bridge USDC', 'Claim the Explorer badge'],
  },
  {
    id: 'pixel-quest',
    brand: 'PIXELVERSE',
    title: 'Enter the Arena',
    description: 'Play the first chapter and earn an early-player collectible.',
    reward: 500,
    chain: 'SOLANA',
    category: 'GAMING',
    participants: '5.1K',
    colors: ['#7B61FF', '#D946EF'],
    tasks: ['Watch the trailer', 'Create your player', 'Complete chapter one'],
  },
  {
    id: 'base-builders',
    brand: 'BASE',
    title: 'Onchain Summer',
    description: 'Explore apps, collect a badge and meet the builders.',
    reward: 400,
    chain: 'BASE',
    category: 'NEW',
    participants: '3.7K',
    colors: ['#175CFF', '#061C66'],
    tasks: ['Explore a featured app', 'Make an on-chain action', 'Claim your badge'],
  },
];

export function campaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.id === id);
}

export interface Quest {
  id: string;
  title: string;
  sub: string;
  reward: number;
  duration: string;
  tag: string;
  novaPick?: boolean;
}

export const QUESTS: Quest[] = [
  {
    id: 'first-swap',
    title: 'First Swap',
    sub: 'Swap any token on Gami',
    reward: 500,
    duration: '5 MIN',
    tag: 'DEFI',
    novaPick: true,
  },
  {
    id: 'daily-login',
    title: 'Daily Check-in',
    sub: 'Open the app 3 days running',
    reward: 100,
    duration: 'DAILY',
    tag: 'STREAK',
  },
  {
    id: 'mint-monday',
    title: 'Mint Mondays',
    sub: 'Mint a free community NFT',
    reward: 250,
    duration: '10 MIN',
    tag: 'NFTs',
    novaPick: true,
  },
  {
    id: 'refer',
    title: 'Bring a Friend',
    sub: 'Invite someone to Gami',
    reward: 500,
    duration: 'ANYTIME',
    tag: 'SOCIAL',
  },
  {
    id: 'share',
    title: 'Spread the Word',
    sub: 'Share your handle card',
    reward: 50,
    duration: '2 MIN',
    tag: 'CREATOR',
  },
  {
    id: 'explore-base',
    title: 'Cross the Bridge',
    sub: 'Bridge assets to Base',
    reward: 300,
    duration: '8 MIN',
    tag: 'MULTI-CHAIN',
  },
];

export interface Badge {
  id: string;
  label: string;
  icon: string;
  color: AvatarColorId;
  /** XP threshold at which the badge unlocks (0 = earned at signup). */
  unlockXp: number;
}

/** 24-badge collection shown on the profile / badges grid. */
export const BADGES: Badge[] = [
  { id: 'starter', label: 'Starter', icon: 'sparkles', color: 'yellow', unlockXp: 0 },
  { id: 'first-swap', label: 'First Swap', icon: 'repeat', color: 'cyan', unlockXp: 500 },
  { id: 'streak-7', label: '7-Day', icon: 'flame', color: 'magenta', unlockXp: 750 },
  { id: 'holder', label: 'Holder', icon: 'gem', color: 'purple', unlockXp: 1000 },
  { id: 'minter', label: 'Minter', icon: 'image', color: 'green', unlockXp: 1500 },
  { id: 'referral', label: 'Recruiter', icon: 'user-plus', color: 'magenta', unlockXp: 2000 },
  { id: 'bridger', label: 'Bridger', icon: 'milestone', color: 'cyan', unlockXp: 2500 },
  { id: 'dao-voter', label: 'Voter', icon: 'vote', color: 'purple', unlockXp: 3000 },
  { id: 'trader', label: 'Trader', icon: 'trending-up', color: 'green', unlockXp: 3500 },
  { id: 'creator', label: 'Creator', icon: 'palette', color: 'yellow', unlockXp: 4000 },
  { id: 'whale', label: 'Whale', icon: 'waves', color: 'cyan', unlockXp: 5000 },
  { id: 'og', label: 'OG', icon: 'crown', color: 'yellow', unlockXp: 6000 },
  { id: 'collector', label: 'Collector', icon: 'layers', color: 'purple', unlockXp: 7000 },
  { id: 'streak-30', label: '30-Day', icon: 'calendar-check', color: 'magenta', unlockXp: 8000 },
  { id: 'diamond', label: 'Diamond', icon: 'diamond', color: 'cyan', unlockXp: 9000 },
  { id: 'pioneer', label: 'Pioneer', icon: 'compass', color: 'green', unlockXp: 10000 },
  { id: 'legend', label: 'Legend', icon: 'star', color: 'yellow', unlockXp: 12000 },
  { id: 'guardian', label: 'Guardian', icon: 'shield', color: 'purple', unlockXp: 14000 },
  { id: 'maxi', label: 'Maxi', icon: 'zap', color: 'magenta', unlockXp: 16000 },
  { id: 'sage', label: 'Sage', icon: 'graduation-cap', color: 'cyan', unlockXp: 18000 },
  { id: 'titan', label: 'Titan', icon: 'mountain', color: 'green', unlockXp: 21000 },
  { id: 'mythic', label: 'Mythic', icon: 'flame', color: 'magenta', unlockXp: 25000 },
  { id: 'ascended', label: 'Ascended', icon: 'rocket', color: 'purple', unlockXp: 30000 },
  { id: 'gami-god', label: 'Gami God', icon: 'crown', color: 'yellow', unlockXp: 40000 },
];
