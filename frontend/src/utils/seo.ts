// Small SEO helper shared by any page that can render a "not found" state
// (Category.tsx, ProductPage.tsx) client-side.
//
// The Apache SPA fallback (public/.htaccess) serves index.html — and
// therefore an HTTP 200 — for literally any path, including a mistyped or
// dead product/category URL. That's the right behavior for real routes
// (it's what makes deep-linking and refreshing /product/:id work at all),
// but it means a genuinely broken URL still returns 200 with a "not
// found" message instead of a real 404 status: a "soft 404", which search
// engines are explicitly told to avoid indexing.
//
// Since there's no server-side rendering here, the closest available fix
// is a client-side <meta name="robots" content="noindex"> tag, toggled
// on/off as the page's found/not-found state changes. It won't fix the
// HTTP status code (that needs SSR or an edge function to do properly),
// but it does tell crawlers not to index the broken-URL state, which is
// the actual harm a soft 404 causes.
export function setNoIndex(active: boolean) {
  const existing = document.querySelector('meta[name="robots"][data-dynamic="true"]');

  if (!active) {
    existing?.remove();
    return;
  }

  if (existing) return; // already set

  const meta = document.createElement('meta');
  meta.setAttribute('name', 'robots');
  meta.setAttribute('content', 'noindex');
  meta.setAttribute('data-dynamic', 'true');
  document.head.appendChild(meta);
}