import React, { useState } from 'react';
import { Star, Check, Heart } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  accent: string;
  onOpenDetails: (product: Product) => void;
}

// Small decorative swatch palette used for the flavour-count indicator dots
// (purely visual, matches the "2 colors / 2 finishes" dot pattern).
const swatchPalette = (accent: string) => [accent, "#1c1c1c", "#D4AF37"];

export const ProductCard: React.FC<ProductCardProps> = ({ product, accent, onOpenDetails }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const defaultFlavour = product.flavours[0] || 'Unflavoured';
  // Negative stock is possible today (an admin can currently type -12 into
  // "Stock Quantity" with no validation — see AdminDashboard.tsx and
  // productController.js for the actual fix to that). Whatever the cause,
  // this display check needs to treat "0 or below" as out of stock, not
  // just exactly 0 — a strict `=== 0` check let a product with -12 stock
  // still show as purchasable. `undefined` (stock not tracked for this
  // product) correctly stays untouched here.
  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;
  const isLowStock =
    product.stockQuantity !== undefined &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= (product.lowStockThreshold ?? 10);

  const handleAdd = (e: React.MouseEvent) => {
    // preventDefault (not just stopPropagation) matters now that the card
    // is a real <a href>: stopPropagation only stops the click from
    // bubbling to other React handlers, it does NOT stop the browser's
    // native link-navigation for the <a> itself. Without preventDefault
    // here, clicking "Add" would both add to cart AND navigate away.
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1, defaultFlavour);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    // Same reasoning as handleAdd above — this button also sits inside
    // the card's <a href>, so its click must be prevented explicitly or
    // the browser will still navigate.
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isWishlisted = isInWishlist(product.id);

  // Bottom-left merchandising label inside the image tile — mirrors the
  // reference design's "Fast delivery" / "Only 7 left" style note.
  const stockLabel = isOutOfStock
    ? "Out of stock"
    : isLowStock
    ? `Only ${product.stockQuantity} left`
    : "Fast dispatch";

  // Variant indicator text (bottom row), e.g. "3 Flavours" or the single
  // flavour name if there's only one.
  const variantLabel =
    product.flavours && product.flavours.length > 1
      ? `${product.flavours.length} Flavours`
      : product.flavours && product.flavours.length === 1
      ? product.flavours[0]
      : product.brand || null;

  const dots = swatchPalette(accent).slice(0, Math.min(3, Math.max(product.flavours?.length || 0, 1)));

  // Real URL for this product — matches pathForProduct()/handleNavigateToProduct()
  // in App.tsx, which key off product.slug (falling back to id) as the
  // canonical URL segment. Using id alone here would produce a different,
  // non-canonical URL for any product that has a distinct slug.
  const productSlug = (product as any).slug || String(product.id);
  const productUrl = `/product/${encodeURIComponent(productSlug)}`;

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      // Let the browser handle modified clicks itself (new tab, new window).
      return;
    }
    e.preventDefault();
    onOpenDetails(product);
  };

  return (
    <a
      href={productUrl}
      onClick={handleCardClick}
      className="group flex flex-col cursor-pointer"
      aria-label={`View ${product.name}`}
    >
      {/* Image Tile */}
      <div
        className="relative rounded-2xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-1"
        style={{ aspectRatio: "4/5", background: "#f2ede6" }}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? "opacity-60" : ""}`}
        />

        {/* Badge */}
        {product.badge && (
          <div
            className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm"
            style={{ background: "rgba(255,255,255,0.95)", color: "#1c1c1c", fontFamily: "'DM Sans', sans-serif" }}
          >
            {product.badge}
          </div>
        )}

        {/* Wishlist Toggle */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          style={{ background: "rgba(255,255,255,0.95)" }}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={14} className={isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-700"} />
        </button>

        {/* Floating price / Add pill */}
        <div
          className="absolute left-3 right-3 bottom-3 z-10 flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 shadow-lg"
          style={{ background: "rgba(255,255,255,0.97)" }}
        >
          <div className="min-w-0">
            <p
              className={`text-[10px] font-medium mb-0.5 truncate ${isOutOfStock ? "text-red-500" : isLowStock ? "text-red-500" : "text-neutral-500"}`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {stockLabel}
            </p>
            <p className="text-[15px] font-bold text-neutral-900 leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              €{product.price.toFixed(2)}
            </p>
          </div>

          {isOutOfStock ? (
            <span
              className="shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold text-neutral-400"
              style={{ background: "#eee", fontFamily: "'DM Sans', sans-serif" }}
            >
              Sold Out
            </span>
          ) : (
            <button
              onClick={handleAdd}
              className="shrink-0 flex items-center gap-1 rounded-full px-4 py-2 text-[11px] font-semibold transition-colors cursor-pointer"
              style={{
                background: added ? "#10B981" : "#1c1c1c",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {added ? <><Check size={12} /> Added</> : "Add"}
            </button>
          )}
        </div>
      </div>

      {/* Info Block (below the tile, on the page background) */}
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-[15px] sm:text-base font-bold text-neutral-900 leading-snug transition-colors group-hover:opacity-80"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {product.name}
          </h3>
          <span className="shrink-0 text-[15px] sm:text-base font-bold text-neutral-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            €{product.price.toFixed(2)}
          </span>
        </div>

        {product.subtitle && (
          <p className="text-[12px] text-neutral-500 mt-0.5 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {product.subtitle}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {variantLabel ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {product.flavours && product.flavours.length > 1 &&
                dots.map((c, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c }} />
                ))
              }
              <span className="text-[11px] text-neutral-500 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {variantLabel}
              </span>
            </div>
          ) : <span />}

          <div className="flex items-center gap-1 shrink-0">
            <Star size={12} fill="#D4AF37" stroke="#D4AF37" />
            <span className="text-[12px] font-semibold text-neutral-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {product.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};