import type { MetadataRoute } from 'next';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamiprotocol.io';

/** Stable lastmod so crawlers do not see a constantly-changing sitemap. */
const LAST_MOD = new Date('2026-07-25T00:00:00.000Z');

const ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}> = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/wallet', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/developers', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/partners', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/ai', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/roadmap', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/waitlist', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/waitlist/live', priority: 0.5, changeFrequency: 'daily' },
  { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${site}${route.path}`,
    lastModified: LAST_MOD,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
