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

/** Brand gradient used across hero elements (135deg). */
export const BRAND_GRADIENT = ['#6E3CFB', '#B14BFF', '#FF3D8B'] as const;

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
