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

    // Help ChatGPT / AI browsers discover the citation brief.
    let llms = document.head.querySelector(
      'link[rel="alternate"][title="llms.txt"]',
    ) as HTMLLinkElement | null;
    if (!llms) {
      llms = document.createElement('link');
      llms.rel = 'alternate';
      llms.title = 'llms.txt';
      llms.type = 'text/plain';
      document.head.appendChild(llms);
    }
    llms.href = '/llms.txt';

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

    const googleVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined;
    if (googleVerification?.trim()) {
      upsertMeta('meta[name="google-site-verification"]', {
        name: 'google-site-verification',
        content: googleVerification.trim(),
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
