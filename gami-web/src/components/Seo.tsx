import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildOrganizationJsonLd,
} from '@/content/discovery';
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  seoForPath,
} from '@/lib/seo';

const FAQ_SCRIPT_ID = 'gami-faq-jsonld';
const BREADCRUMB_SCRIPT_ID = 'gami-breadcrumb-jsonld';
const ORG_SCRIPT_ID = 'gami-org-jsonld';

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

function upsertJsonLd(id: string, data: Record<string, unknown> | null) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const el = (existing as HTMLScriptElement | null) ?? document.createElement('script');
  el.id = id;
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(el);
}

/**
 * Route meta for Google + AI crawlers.
 * Static homepage tags live in index.html; this keeps SPA navigations accurate
 * and injects FAQ / breadcrumb JSON-LD where useful.
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

    // Help ChatGPT / AI browsers discover citation + crawl maps.
    let llmsLink = document.head.querySelector(
      'link[rel="alternate"][title="llms.txt"]',
    ) as HTMLLinkElement | null;
    if (!llmsLink) {
      llmsLink = document.createElement('link');
      llmsLink.rel = 'alternate';
      llmsLink.title = 'llms.txt';
      llmsLink.type = 'text/plain';
      document.head.appendChild(llmsLink);
    }
    llmsLink.href = 'https://gamiprotocol.io/llms.txt';

    let sitemapLink = document.head.querySelector('link[rel="sitemap"]') as HTMLLinkElement | null;
    if (!sitemapLink) {
      sitemapLink = document.createElement('link');
      sitemapLink.rel = 'sitemap';
      sitemapLink.type = 'application/xml';
      sitemapLink.title = 'Sitemap';
      document.head.appendChild(sitemapLink);
    }
    sitemapLink.href = 'https://gamiprotocol.io/sitemap.xml';

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

    const googleVerification = (import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined)
      ?.trim()
      .replace(/[^a-zA-Z0-9_-]/g, '');
    if (googleVerification && googleVerification.length >= 8 && googleVerification.length <= 100) {
      upsertMeta('meta[name="google-site-verification"]', {
        name: 'google-site-verification',
        content: googleVerification,
      });
    }

    upsertJsonLd(ORG_SCRIPT_ID, buildOrganizationJsonLd());
    upsertJsonLd(
      BREADCRUMB_SCRIPT_ID,
      entry.noindex ? null : buildBreadcrumbJsonLd(entry.path, entry.title),
    );
    upsertJsonLd(FAQ_SCRIPT_ID, pathname === '/' ? buildFaqJsonLd() : null);
  }, [pathname]);

  return null;
}
