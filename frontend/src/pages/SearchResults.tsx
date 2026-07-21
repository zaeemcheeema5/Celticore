import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Star, Check } from 'lucide-react';
import { Category as CategoryType, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';

interface SearchResultsProps {
  query: string;
  products: Product[];
  categories: CategoryType[];
  onNavigate: (page: string) => void;
  onOpenDetails: (product: Product) => void;
}

const ACCENT = "#10B981";

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  products,
  categories,
  onNavigate,
  onOpenDetails,
}) => {
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "rating">("popular");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Reset filters whenever the search term changes
    setSelectedBrands([]);
    setSelectedCategories([]);
    setMinRating(0);
    setInStockOnly(false);
    setMaxPrice(null);
  }, [query]);

  // Products that textually match the query — same logic as the navbar dropdown
  const matchedProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const haystack = [p.name, p.subtitle, p.brand, p.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q) && p.isActive !== false;
    });
  }, [query, products]);

  const availableBrands = useMemo(
    () => Array.from(new Set(matchedProducts.map((p) => p.brand).filter(Boolean))) as string[],
    [matchedProducts]
  );

  const availableCategoryIds = useMemo(
    () => Array.from(new Set(matchedProducts.map((p) => p.category).filter(Boolean))) as string[],
    [matchedProducts]
  );

  const priceCeiling = useMemo(
    () => matchedProducts.reduce((max, p) => Math.max(max, p.price || 0), 0),
    [matchedProducts]
  );

  const filteredProducts = useMemo(() => {
    return matchedProducts.filter((p) => {
      if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) return false;
      if (selectedCategories.length > 0 && (!p.category || !selectedCategories.includes(p.category))) return false;
      if (minRating > 0 && (p.rating || 0) < minRating) return false;
      if (inStockOnly && p.stockQuantity !== undefined && p.stockQuantity <= 0) return false;
      if (maxPrice !== null && p.price > maxPrice) return false;
      return true;
    });
  }, [matchedProducts, selectedBrands, selectedCategories, minRating, inStockOnly, maxPrice]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "price-low") return list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") return list.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") return list.sort((a, b) => b.rating - a.rating);
    return list.sort((a, b) => b.reviews - a.reviews);
  }, [filteredProducts, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => (prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]));
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setMinRating(0);
    setInStockOnly(false);
    setMaxPrice(null);
  };

  const categoryName = (id: string) => categories.find((c) => String(c.id) === String(id))?.name || id;

  const hasActiveFilters =
    selectedBrands.length > 0 || selectedCategories.length > 0 || minRating > 0 || inStockOnly || maxPrice !== null;

  return (
    <div className="min-h-screen" style={{ background: "#050505" }}>
      {/* Header */}
      <div
        className="relative pt-20 sm:pt-24 pb-8 sm:pb-10 px-4 sm:px-6 md:px-14 lg:px-20 overflow-hidden"
        style={{ background: "#080808", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 80% 50%, ${ACCENT}18 0%, transparent 65%)` }}
        />
        <div className="relative max-w-7xl mx-auto">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 mb-6 text-xs font-semibold tracking-widest uppercase transition-colors hover:text-white text-white/40 cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <ArrowLeft size={14} /> Back to Home
          </button>

          <h1
            className="font-black uppercase leading-none text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(1.8rem, 5vw, 3.2rem)" }}
          >
            Search: <span style={{ color: ACCENT }}>"{query}"</span>
          </h1>
          <p className="text-white/40 text-sm mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"} found
          </p>
        </div>
      </div>

      {/* Body: Filters + Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-14 lg:px-20 py-8 sm:py-12 flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xs font-black tracking-widest uppercase text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Filters
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 uppercase tracking-wider cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Category Filter */}
          {availableCategoryIds.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Category</p>
              <div className="flex flex-col gap-1.5">
                {availableCategoryIds.map((catId) => (
                  <label key={catId} className="flex items-center gap-2 cursor-pointer group">
                    <span
                      onClick={() => toggleCategory(catId)}
                      className="w-4 h-4 flex items-center justify-center border rounded-sm transition-colors shrink-0"
                      style={{
                        borderColor: selectedCategories.includes(catId) ? ACCENT : "rgba(255,255,255,0.2)",
                        background: selectedCategories.includes(catId) ? ACCENT : "transparent",
                      }}
                    >
                      {selectedCategories.includes(catId) && <Check size={11} color="#000" />}
                    </span>
                    <span
                      onClick={() => toggleCategory(catId)}
                      className="text-xs text-white/60 group-hover:text-white transition-colors"
                    >
                      {categoryName(catId)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Brand</p>
              <div className="flex flex-col gap-1.5">
                {availableBrands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                    <span
                      onClick={() => toggleBrand(brand)}
                      className="w-4 h-4 flex items-center justify-center border rounded-sm transition-colors shrink-0"
                      style={{
                        borderColor: selectedBrands.includes(brand) ? ACCENT : "rgba(255,255,255,0.2)",
                        background: selectedBrands.includes(brand) ? ACCENT : "transparent",
                      }}
                    >
                      {selectedBrands.includes(brand) && <Check size={11} color="#000" />}
                    </span>
                    <span
                      onClick={() => toggleBrand(brand)}
                      className="text-xs text-white/60 group-hover:text-white transition-colors"
                    >
                      {brand}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Filter */}
          {priceCeiling > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">
                Max Price: Rs. {(maxPrice ?? priceCeiling).toLocaleString()}
              </p>
              <input
                type="range"
                min={0}
                max={priceCeiling}
                value={maxPrice ?? priceCeiling}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          )}

          {/* Rating Filter */}
          <div className="mb-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Rating</p>
            <div className="flex flex-col gap-1.5">
              {[4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? 0 : r)}
                  className="flex items-center gap-1.5 text-xs cursor-pointer transition-colors"
                  style={{ color: minRating === r ? ACCENT : "rgba(255,255,255,0.5)" }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      fill={s <= r ? (minRating === r ? ACCENT : "#D4AF37") : "none"}
                      stroke={s <= r ? (minRating === r ? ACCENT : "#D4AF37") : "rgba(255,255,255,0.25)"}
                    />
                  ))}
                  <span className="ml-1">& up</span>
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Filter */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <span
              onClick={() => setInStockOnly(!inStockOnly)}
              className="w-4 h-4 flex items-center justify-center border rounded-sm transition-colors shrink-0"
              style={{
                borderColor: inStockOnly ? ACCENT : "rgba(255,255,255,0.2)",
                background: inStockOnly ? ACCENT : "transparent",
              }}
            >
              {inStockOnly && <Check size={11} color="#000" />}
            </span>
            <span
              onClick={() => setInStockOnly(!inStockOnly)}
              className="text-xs text-white/60 group-hover:text-white transition-colors"
            >
              In Stock Only
            </span>
          </label>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Sort Bar */}
          <div className="flex items-center justify-end gap-2 flex-wrap mb-6">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Sort:</span>
            <div className="flex gap-1 flex-wrap">
              {(["popular", "price-low", "price-high", "rating"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className="px-3 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer"
                  style={{
                    background: sortBy === s ? ACCENT : "transparent",
                    color: sortBy === s ? "#000" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${sortBy === s ? ACCENT : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {s === "popular" ? "Popular" : s === "price-low" ? "Price ↑" : s === "price-high" ? "Price ↓" : "Rating"}
                </button>
              ))}
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="py-20 text-center text-white/45 italic text-sm">
              {matchedProducts.length === 0
                ? `No products found for "${query}".`
                : "No products match the selected filters."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} accent={ACCENT} onOpenDetails={onOpenDetails} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};