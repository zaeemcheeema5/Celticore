import React, { useState } from 'react';
import { X, Plus, Minus, Heart, Check, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { ReviewsSection } from './ReviewsSection';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  accent: string;
  onRequireAuth?: () => void;
  onViewFullPage?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  accent,
  onRequireAuth,
  onViewFullPage,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavour, setSelectedFlavour] = useState(product?.flavours[0] || 'Unflavoured');
  const [added, setAdded] = useState(false);

  React.useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedFlavour(product.flavours[0] || 'Unflavoured');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedFlavour);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Height strategy: on mobile the dialog is unconstrained and the
          overlay itself scrolls (natural content height, no magic
          calc(100vh - Npx) guesses tied to the image's height). From md up,
          the two columns sit side by side so the dialog is capped at 90vh
          and only the details column scrolls internally. */}
      <div
        className="relative w-full max-w-4xl sm:rounded-2xl border border-white/10 bg-[#080808] text-white overflow-hidden shadow-2xl flex flex-col md:flex-row my-0 md:my-8 md:max-h-[90vh]"
        style={{
          boxShadow: `0 0 50px ${accent}0d`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 text-white hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-all z-20 cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Product Visual Column */}
        <div className="w-full md:w-1/2 relative bg-[#111] shrink-0 overflow-hidden md:rounded-tl-2xl md:rounded-bl-2xl">
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-auto md:h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80 md:hidden" />
          <div
            className="absolute inset-0 pointer-events-none opacity-40 hidden md:block"
            style={{ background: `linear-gradient(135deg, transparent 60%, ${accent}22 100%)` }}
          />
        </div>

        {/* Product Details & Reviews Column */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col md:overflow-y-auto md:min-h-0">
          {/* Header */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span
                className="px-3 py-1 text-[10px] font-semibold tracking-wide rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}
              >
                {product.category || 'Supplement'}
              </span>
              {product.badge && (
                <span
                  className="px-3 py-1 text-[10px] font-semibold tracking-wide rounded-full text-black"
                  style={{ background: accent, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {product.badge}
                </span>
              )}
            </div>

            <h2
              className="text-2xl sm:text-[1.75rem] md:text-[1.65rem] lg:text-3xl font-black uppercase tracking-tight text-white leading-[1.05]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {product.name}
            </h2>
            <p className="text-xs sm:text-[0.8rem] font-semibold tracking-wide mt-1" style={{ color: accent }}>{product.subtitle}</p>
            {onViewFullPage && (
              <button
                onClick={() => onViewFullPage(product)}
                className="text-[10px] font-semibold tracking-widest uppercase text-white/35 hover:text-white transition-colors cursor-pointer mt-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                View Full Product Page →
              </button>
            )}
          </div>

          {/* Description */}
          <p className="text-[13px] sm:text-xs text-white/60 leading-relaxed mb-5 sm:mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {product.description}
          </p>

          {/* Configurations */}
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {/* Flavour Selector */}
            {product.flavours && product.flavours.length > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">Select Flavour</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.flavours.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFlavour(f)}
                      className="px-3.5 py-1.5 text-xs font-semibold uppercase transition-all duration-200 border rounded-full cursor-pointer"
                      style={{
                        borderColor: selectedFlavour === f ? accent : "rgba(255,255,255,0.12)",
                        color: selectedFlavour === f ? accent : "rgba(255,255,255,0.45)",
                        background: selectedFlavour === f ? `${accent}12` : "transparent",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Price */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30">Quantity</p>
                {/* See ProductCard.tsx for why this is `<= 0`, not `=== 0`. */}
                {product.stockQuantity !== undefined && product.stockQuantity <= 0 ? (
                  <span className="text-xs text-red-500 font-bold mt-1.5 block">Unavailable</span>
                ) : (
                  <div className="flex items-center gap-1 mt-1.5 border border-white/10 bg-black/40 px-1.5 py-1 rounded-full w-fit">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="flex items-center justify-center w-7 h-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(Math.max(product.stockQuantity ?? 999, 1), q + 1))}
                      className="flex items-center justify-center w-7 h-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Price Display */}
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30">Price</p>
                <div className="mt-1 flex items-baseline justify-end gap-2">
                  <span className="text-2xl sm:text-[1.6rem] font-black text-white leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    €{(product.price * quantity).toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-white/30 line-through" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      €{(parseFloat(product.originalPrice.toString()) * quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Banner */}
          {product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold ?? 10) && (
            <div
              className="flex items-center gap-2 text-[10px] text-red-400 font-bold mb-5 uppercase tracking-widest px-3 py-2 rounded-full w-fit"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              <AlertTriangle size={12} className="shrink-0 animate-pulse" />
              Only {product.stockQuantity} left in stock!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-7 sm:mb-8">
            {/* See ProductCard.tsx for why this is `<= 0`, not `=== 0`. */}
            {product.stockQuantity !== undefined && product.stockQuantity <= 0 ? (
              <button
                disabled
                className="flex-1 py-3.5 sm:py-3 text-xs font-black tracking-widest uppercase transition-all duration-250 opacity-40 bg-white/5 border border-white/10 text-white cursor-not-allowed flex items-center justify-center rounded-full"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Out Of Stock
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 sm:py-3 text-xs font-black tracking-widest uppercase transition-all duration-250 cursor-pointer flex items-center justify-center gap-1.5 rounded-full"
                style={{
                  background: added ? '#10B981' : `linear-gradient(135deg, ${accent}, ${accent}bb)`,
                  color: "#000",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  boxShadow: added ? '0 0 20px rgba(16,185,129,0.4)' : `0 0 20px ${accent}35`,
                }}
              >
                {added ? <><Check size={14} /> Added to Cart</> : <><Plus size={14} /> Add to Cart</>}
              </button>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className="flex items-center justify-center w-12 sm:w-auto sm:p-3 border border-white/15 hover:border-white/40 bg-transparent text-white/60 hover:text-white transition-all cursor-pointer rounded-full"
              title="Add to Wishlist"
              aria-label="Add to Wishlist"
            >
              <Heart size={16} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          {/* Reviews */}
          <ReviewsSection
            productId={product.id}
            accent={accent}
            onRequireAuth={() => onRequireAuth && onRequireAuth()}
          />
        </div>
      </div>
    </div>
  );
};