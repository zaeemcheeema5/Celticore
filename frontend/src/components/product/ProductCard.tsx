import React, { useState } from 'react';
import { Star, Plus, Check, Heart, Eye } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  accent: string;
  onOpenDetails: (product: Product) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          fill={s <= Math.round(rating) ? "#D4AF37" : "none"}
          stroke={s <= Math.round(rating) ? "#D4AF37" : "rgba(255,255,255,0.25)"}
        />
      ))}
    </div>
  );
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, accent, onOpenDetails }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [selectedFlavour, setSelectedFlavour] = useState(product.flavours[0] || 'Unflavoured');

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, selectedFlavour);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col overflow-hidden transition-all duration-350 cursor-pointer"
      style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = `1px solid ${accent}40`;
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 40px ${accent}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Badge */}
      {product.badge && (
        <div
          className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase"
          style={{ background: accent, color: "#000", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {product.badge}
        </div>
      )}

      {/* Wishlist Toggle Heart */}
      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full border border-white/5 bg-black/60 hover:bg-black/90 text-white/50 hover:text-white transition-all cursor-pointer"
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart size={13} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
      </button>

      {/* Image Container */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "1/1", background: "#111" }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #0d0d0d 0%, transparent 50%)" }}
        />
        {/* Quick View Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white text-black rounded-none">
            <Eye size={12} />
            Quick View
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={product.rating} />
          <span className="text-[10px] text-white/30" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            ({product.reviews.toLocaleString()})
          </span>
        </div>

        {/* Name, Brand & Subtitle */}
        <div className="mb-0.5">
          {product.brand && (
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold block mb-0.5">
              {product.brand}
            </span>
          )}
          <h3
            className="text-lg font-black uppercase leading-tight text-white group-hover:text-emerald-400 transition-colors"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {product.name}
          </h3>
        </div>
        
        {product.subtitle && (
          <p
            className="text-[11px] mb-2"
            style={{ color: accent, fontFamily: "'DM Sans', sans-serif", opacity: 0.85 }}
          >
            {product.subtitle}
          </p>
        )}
        
        <p
          className="text-[11px] text-white/40 leading-relaxed mb-3 flex-1 line-clamp-2"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {product.description}
        </p>

        {/* Flavour Selector */}
        {product.flavours && product.flavours.length > 0 && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <p
              className="text-[9px] font-bold tracking-widest uppercase text-white/30 mb-1.5"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Flavour
            </p>
            <div className="flex flex-wrap gap-1.5">
              {product.flavours.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFlavour(f)}
                  className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    border: `1px solid ${selectedFlavour === f ? accent : "rgba(255,255,255,0.12)"}`,
                    color: selectedFlavour === f ? accent : "rgba(255,255,255,0.35)",
                    background: selectedFlavour === f ? `${accent}12` : "transparent",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Warning */}
        {product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold ?? 10) && (
          <div className="text-[10px] text-red-400 font-bold mb-3 uppercase tracking-wider animate-pulse">
            ⚠️ Low Stock: Only {product.stockQuantity} left
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <span
              className="text-xl font-black text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              €{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span
                className="text-xs text-white/30 line-through ml-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                €{parseFloat(product.originalPrice.toString()).toFixed(2)}
              </span>
            )}
          </div>
          
          {product.stockQuantity === 0 ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-250 opacity-40 bg-white/5 border border-white/10 text-white cursor-not-allowed"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                minWidth: 100,
                justifyContent: "center",
              }}
            >
              Out Of Stock
            </button>
          ) : (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-250 cursor-pointer"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                background: added ? "#10B981" : accent,
                color: "#000",
                minWidth: 100,
                justifyContent: "center",
              }}
            >
              {added ? <><Check size={12}/> Added</> : <><Plus size={12}/> Add to Cart</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
