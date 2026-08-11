#!/usr/bin/env node
// Regenerates public/sitemap.xml from the live catalog before every build.
//
// Why this exists: sitemap.xml was previously a hand-written static file
// listing only the 6 category pages — no individual product URLs, so
// Google had no path to discover a single product even after the
// noindex/robots.txt fix. Product cards are now real crawlable <a href>
// links (see ProductCard.tsx), but a sitemap is still what tells a
// crawler *when* to bother re-checking a URL and gives it a starting
// point without having to click through the whole site first.
//
// Runs as part of `npm run build` (see package.json), before `vite build`,
// so the freshly-written file is what actually gets copied from public/
// into dist/.
//
// Categories AND products are both pulled from the live API rather than
// hardcoded, so a renamed/removed category can't leave a stale, 404-ing
// URL sitting in the sitemap (the old static file had exactly this bug —
// a "/categories" entry that isn't a real route at all).

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = process.env.VITE_API_URL || 'https://api.thecelticore.com';
const SITE_URL = process.env.SITE_URL || 'https://thecelticore.com';
const OUTPUT_PATH = path.resolve(__dirname, '../public/sitemap.xml');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchJson(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`${endpoint} responded ${res.status}`);
  }
  return res.json();
}

// GET /api/products returns a bare array, but GET /api/categories wraps
// its rows in { success, categories: [...] } — this normalizes either
// shape (and a couple of other plausible envelope names) into a plain
// array so the caller doesn't need to know which one it's dealing with.
function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.categories)) return payload.categories;
  if (payload && Array.isArray(payload.products)) return payload.products;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  const lines = [`  <url>`, `    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority !== undefined) lines.push(`    <priority>${priority}</priority>`);
  lines.push(`  </url>`);
  return lines.join('\n');
}

async function main() {
  const entries = [];

  // Static top-level pages
  entries.push(urlEntry(`${SITE_URL}/`, { changefreq: 'daily', priority: '1.0' }));
  entries.push(urlEntry(`${SITE_URL}/products`, { changefreq: 'daily', priority: '0.8' }));

  // Categories — pulled live so a renamed/deleted category can't leave a
  // dead URL behind, and a new one is picked up automatically.
  let categories = [];
  try {
    categories = asArray(await fetchJson('/api/categories'));
  } catch (err) {
    console.warn(`[generate-sitemap] Could not fetch categories, skipping: ${err.message}`);
  }

  for (const cat of categories) {
    const slug = cat.slug || slugify(cat.name) || String(cat.id);
    entries.push(urlEntry(`${SITE_URL}/${slug}`, { changefreq: 'weekly', priority: '0.7' }));
  }

  // Products — the actual gap this script exists to close.
  let products = [];
  try {
    products = asArray(await fetchJson('/api/products'));
  } catch (err) {
    console.warn(`[generate-sitemap] Could not fetch products, skipping: ${err.message}`);
  }

  const activeProducts = products.filter(
    (p) => p.is_active === undefined || p.is_active === 1 || p.is_active === true
  );

  for (const product of activeProducts) {
    // Must match the slug logic in frontend/src/api/products.ts
    // (mapProductFromBackend) and the id sanitization in
    // backend/controllers/productController.js, so the sitemap always
    // points at the same URL the app itself will actually render.
    const slug = product.slug || slugify(product.name) || String(product.id);
    entries.push(
      urlEntry(`${SITE_URL}/product/${encodeURIComponent(slug)}`, {
        changefreq: 'weekly',
        priority: '0.6',
      })
    );
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  await writeFile(OUTPUT_PATH, xml, 'utf-8');
  console.log(
    `[generate-sitemap] Wrote ${entries.length} URLs (${categories.length} categories, ${activeProducts.length} products) to ${OUTPUT_PATH}`
  );
}

main().catch((err) => {
  // Never fail the whole build over the sitemap — a stale sitemap is far
  // better than a broken deploy. Falls back to whatever public/sitemap.xml
  // already has on disk.
  console.error(`[generate-sitemap] Failed, keeping existing sitemap.xml: ${err.message}`);
});
