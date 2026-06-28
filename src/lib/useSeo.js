import { useEffect } from 'react';

const SITE_ORIGIN = 'https://nudigofinance.base44.app';

function ensureCanonical(path = '/') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const href = `${SITE_ORIGIN}${cleanPath === '/' ? '' : cleanPath}`;
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function ensureSiteName() {
  const metas = [
    { prop: 'property', key: 'og:site_name', content: 'Nudigo' },
    { prop: 'name', key: 'application-name', content: 'Nudigo' },
    { prop: 'name', key: 'apple-mobile-web-app-title', content: 'Nudigo' },
  ];
  metas.forEach(({ prop, key, content }) => {
    let el = document.querySelector(`meta[${prop}='${key}']`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(prop, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  });
}

export function useSeo({ title, description, schema, path } = {}) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    ensureSiteName();
    ensureCanonical(path);

    let scriptEl = null;
    if (schema) {
      scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.textContent = JSON.stringify(schema);
      document.head.appendChild(scriptEl);
    }

    return () => {
      if (scriptEl) document.head.removeChild(scriptEl);
    };
  }, [title, description, JSON.stringify(schema), path]);
}