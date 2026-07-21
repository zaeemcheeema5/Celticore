import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Shield, Zap, Droplets, Sun, Leaf, LayoutGrid } from 'lucide-react';
import { Category as CategoryType, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';

interface CategoryProps {
  pageId: string;
  categories: CategoryType[];
  products: Product[];
  onNavigate: (page: string) => void;
  onOpenDetails: (product: Product) => void;
}

const ALL_PRODUCTS_PAGE_ID = 'products';

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'protein': return Shield;
    case 'creatine': return Zap;
    case 'eaa-bcaa': return Droplets;
    case 'vitamins': return Sun;
    case 'pre-workout': return Zap;
    case 'wellbeing': return Leaf;
    default: return Zap;
  }
};

export const Category: React.FC<CategoryProps> = ({
  pageId,
  categories,
  products,
  onNavigate,
  onOpenDetails,
}) => {
  const isAllProducts = pageId === ALL_PRODUCTS_PAGE_ID;
  const cat = categories.find((c) => String(c.id) === String(pageId) || c.slug === pageId);

  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "rating">("popular");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageId]);

  if (!isAllProducts && !cat) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-neutral-400 text-sm"
        style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F3ECDD 100%)" }}
      >
        Category not found.
      </div>
    );
  }

  const categoryProducts = isAllProducts
    ? products.filter((p) => p.isActive !== false)
    : products.filter((p) =>
        (String(p.category) === String(pageId) || String(p.category) === String(cat!.id)) &&
        (p.isActive !== false)
      );

  const sortedProducts = [...categoryProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return b.reviews - a.reviews;
  });

  const Icon = isAllProducts ? LayoutGrid : getCategoryIcon(cat!.id);
  const accent = isAllProducts ? "#10B981" : (cat!.accentColor || cat!.accent_color || "#10B981");
  const cardImg = isAllProducts ? "" : (cat!.cardImage || cat!.card_image || cat!.image || "");
  const displayName = isAllProducts ? "All Products" : cat!.name;
  const displayTagline = isAllProducts ? "Full Catalog" : cat!.tagline;
  const displayDescription = isAllProducts ? "Every product across every category" : cat!.description;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F3ECDD 100%)" }}>
      {/* Category Hero Banner */}
      <div
        className="relative pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-6 md:px-14 lg:px-20 overflow-hidden"
        style={{ background: "#F7F2E8", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${cardImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.07,
          }}
        />

        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 80% 50%, ${accent}18 0%, transparent 65%)` }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${accent}40, transparent)` }}
        />

        <div className="relative max-w-7xl mx-auto">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 mb-6 text-xs font-semibold tracking-widest uppercase transition-colors hover:text-neutral-900 text-neutral-500 cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <ArrowLeft size={14} /> Back to Home
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
                >
                  <Icon size={16} style={{ color: accent }} />
                </div>
                <span
                  className="text-[10px] font-bold tracking-[0.35em] uppercase"
                  style={{ color: accent, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {displayTagline}
                </span>
              </div>

              <h1
                className="font-black uppercase leading-none text-neutral-900"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.2rem, 6vw, 4rem)" }}
              >
                {displayName}
              </h1>

              <p className="text-neutral-500 text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {categoryProducts.length} products — {displayDescription}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Sort:
              </span>
              <div className="flex gap-1 flex-wrap">
                {(["popular", "price-low", "price-high", "rating"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className="px-3 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: sortBy === s ? accent : "transparent",
                      color: sortBy === s ? "#000" : "rgba(0,0,0,0.45)",
                      border: `1px solid ${sortBy === s ? accent : "rgba(0,0,0,0.12)"}`,
                    }}
                  >
                    {s === "popular" ? "Popular" : s === "price-low" ? "Price ↑" : s === "price-high" ? "Price ↓" : "Rating"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-14 lg:px-20 py-8 sm:py-12">
        {sortedProducts.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 italic text-sm">
            No products found under this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                accent={accent}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* More Categories */}
      <div
        className="px-4 sm:px-6 md:px-14 lg:px-20 py-10 sm:py-12"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-2xl font-black uppercase tracking-tight text-neutral-900 mb-6"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            More <span style={{ color: accent }}>Categories</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories
              .filter((c) => c.id !== pageId && c.slug !== pageId)
              .map((c) => {
                const CatIcon = getCategoryIcon(c.id);
                const otherAccent = c.accentColor || c.accent_color || "#10B981";
                return (
                  <button
                    key={c.id}
                    onClick={() => onNavigate(c.id)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-250 cursor-pointer"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      border: `1px solid ${otherAccent}30`,
                      color: otherAccent,
                      background: `${otherAccent}08`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${otherAccent}20`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${otherAccent}08`; }}
                  >
                    <CatIcon size={13} />
                    {c.name}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};