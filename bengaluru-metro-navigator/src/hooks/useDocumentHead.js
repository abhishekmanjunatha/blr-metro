import { useEffect } from 'react';

const BASE_URL = 'https://abhishekmanjunatha.github.io/blr-metro';
const SITE_NAME = 'Namma Metro Navigator';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Sets document title, meta description, canonical URL, and OG tags per page.
 * Call once in each page component with page-specific values.
 */
export default function useDocumentHead({
  title,
  description,
  path = '/',
  image,
  type = 'website',
}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Bengaluru Metro Route Planner, Fares & Map`;
    const fullUrl = `${BASE_URL}${path}`;
    const ogImage = image || DEFAULT_IMAGE;

    // Title
    document.title = fullTitle;

    // Helper to set/create a <meta> tag
    const setMeta = (attr, key, content) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Description
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:url', fullUrl);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);

    // Twitter
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:image', ogImage);

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = `${SITE_NAME} | Bengaluru Metro Route Planner, Fares & Map`;
    };
  }, [title, description, path, image, type]);
}
