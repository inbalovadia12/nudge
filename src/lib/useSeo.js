import { useEffect } from 'react';

export function useSeo({ title, description, schema }) {
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
  }, [title, description, JSON.stringify(schema)]);
}