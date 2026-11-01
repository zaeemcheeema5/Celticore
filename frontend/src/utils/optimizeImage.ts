/**
 * PERFORMANCE: product/category images are uploaded through the admin
 * dashboard straight to Cloudinary (see backend/controllers/uploadController.js),
 * so `product.image` / `category.cardImage` are full Cloudinary delivery URLs
 * like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v169.../celticore/products/x.png
 *
 * Cloudinary can transform an image at delivery time just by adding
 * parameters into that URL — no re-upload, no reprocessing job, and it
 * works retroactively on every image already uploaded:
 *   - f_auto  → serve WebP/AVIF to browsers that support it, original
 *               format otherwise (this is the "WebP/AVIF" ask for every
 *               product/category photo on the site, not just the 3 static
 *               hero images)
 *   - q_auto  → Cloudinary's perceptual-quality algorithm picks the
 *               smallest file that still looks right, instead of shipping
 *               whatever quality the original upload happened to be
 *   - w_<n>   → downscale to the size it's actually displayed at, so a
 *               1200px product photo isn't shipped to render a 300px card
 *
 * This is intentionally a pure string transform: if the URL isn't a
 * Cloudinary URL (e.g. a local dev placeholder, or something already
 * transformed), it's returned untouched — same behavior as before.
 */
export function optimizeImageUrl(url: string | undefined | null, width?: number): string {
  if (!url) return url ?? "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;

  const transform = width ? `f_auto,q_auto,w_${width},dpr_auto` : `f_auto,q_auto,dpr_auto`;

  // Don't double up if this URL has already been run through here (or
  // already carries its own transformation segment).
  if (/\/upload\/[^/]*f_auto/.test(url)) return url;

  return url.replace("/upload/", `/upload/${transform}/`);
}
