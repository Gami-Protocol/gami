import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  seoForPath,
} from '@/lib/seo';

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Keeps title/description/canonical/OG tags in sync with the active route.
 * Static tags in index.html cover non-JS crawlers for the homepage shell;
 * robots.txt + sitemap.xml are the primary crawl entry points.
 */
export function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = seoForPath(pathname);
    const url = absoluteUrl(entry.path === '/' ? '/' : entry.path);

    document.title = entry.title;

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: entry.description,
    });
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: entry.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    });

    upsertLink('canonical', url);

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: entry.title });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: entry.description,
    });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
    upsertMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: DEFAULT_OG_IMAGE,
    });

    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: entry.title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: entry.description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: DEFAULT_OG_IMAGE,
    });
  }, [pathname]);

  return null;
}
