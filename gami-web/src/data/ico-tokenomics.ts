export const ICO_STATS = [
  { label: 'Total Supply', value: '1,000,000,000', sub: 'FIXED' },
  { label: 'Community', value: '40%', sub: '400M TOKENS' },
  { label: 'Target Staked', value: '>50%', sub: 'CIRCULATING' },
] as const;

export const ALLOCATION_ROWS = [
  {
    bucket: 'Community Rewards & Ecosystem',
    percent: 40,
    tokens: '400,000,000',
    vesting: 'Linear emission over 5 years',
    purpose: 'XP-to-$GAMI conversion, quests, grants, incentives',
  },
  {
    bucket: 'Team & Advisors',
    percent: 20,
    tokens: '200,000,000',
    vesting: '1-yr cliff, then 3-yr linear',
    purpose: 'Long-term alignment',
  },
  {
    bucket: 'Treasury',
    percent: 15,
    tokens: '150,000,000',
    vesting: 'Governance-controlled release',
    purpose: 'Operations, liquidity, contingencies',
  },
  {
    bucket: 'Strategic Partners',
    percent: 15,
    tokens: '150,000,000',
    vesting: '6-mo cliff, then 2-yr linear',
    purpose: 'Integrations, BD, exchanges, MM',
  },
  {
    bucket: 'Seed & Private Investors',
    percent: 10,
    tokens: '100,000,000',
    vesting: '25% at TGE, linear over 18 months',
    purpose: 'Capital for build & launch',
  },
] as const;

export const DUAL_TOKEN = {
  xp: {
    label: 'XP (Experience Points)',
    type: 'Non-transferable, soulbound',
    purpose: 'Tracks effort, progression, reputation',
    supply: 'Dynamic / uncapped (earned)',
    where: 'Per-user progression ledger',
  },
  gami: {
    label: '$GAMI',
    type: 'Transferable utility & governance',
    purpose: 'Stores and moves economic value',
    supply: 'Fixed at 1,000,000,000',
    where: 'On-chain (EVM), bridgeable',
  },
} as const;

export const FLYWHEEL_SINKS = [
  'Staking lockups (target >50%)',
  'Fee payment & discounts in $GAMI',
  'Partner campaign funding (buy-side)',
  'Premium feature & tier access',
  'Governance participation',
] as const;

export const FLYWHEEL_EMISSIONS = [
  '5-yr linear community emission',
  'Investor unlocks (18-mo linear post-TGE)',
  'Team unlocks (post 1-yr cliff)',
  'Partner unlocks (post 6-mo cliff)',
  'Treasury releases (governance-gated)',
] as const;

export const UTILITIES = [
  {
    icon: 'xp',
    title: 'XP Multipliers',
    description: 'Stake to boost earnings up to 5x. Real activity converts to real value through the XP funnel.',
  },
  {
    icon: 'gov',
    title: 'Governance',
    description: 'Vote on emissions, treasury deployment, fee parameters, and grant allocation. Progressive DAO transition.',
  },
  {
    icon: 'pool',
    title: 'Reward Pools',
    description: 'Partners fund campaigns in $GAMI. Users earn and redeem against sponsored quest pools.',
  },
  {
    icon: 'premium',
    title: 'Tier Access',
    description: 'Unlock premium SDK tiers, higher API limits, exclusive quests, and partner-gated features.',
  },
  {
    icon: 'fee',
    title: 'Fee Discounts',
    description: 'Pay protocol and cross-chain fees in $GAMI at a discount — a direct usage sink.',
  },
  {
    icon: 'stake',
    title: 'Staking Rewards',
    description: 'Earn emissions share and protocol fees. Staked supply targets >50% of circulating float.',
  },
] as const;

export const PHASES = [
  {
    num: '01',
    title: 'Whitelist & Testing',
    description:
      'Current phase. Join the genesis waitlist, link your wallet, and earn early multipliers through incentivized testnet activity.',
    active: true,
  },
  {
    num: '02',
    title: 'Private Genesis Sale',
    description:
      'Seed and strategic partners gain priority allocation. Minimum lock-up periods and vesting schedules apply.',
    active: false,
  },
  {
    num: '03',
    title: 'Public Protocol Launch',
    description:
      'Token becomes publicly available. Liquidity pools open on major DEXs. TGE unlocks begin per vesting schedule.',
    active: false,
  },
] as const;
