import type { MetadataRoute } from 'next';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamiprotocol.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/wallet', '/developers', '/partners', '/ai', '/roadmap', '/waitlist'];
  return routes.map((route) => ({
    url: `${site}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
