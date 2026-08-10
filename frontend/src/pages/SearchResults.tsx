import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Star, Check, SearchX } from 'lucide-react';
import { Category as CategoryType, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';

interface SearchResultsProps {
  query: string;
  products: Product[];
  categories: CategoryType[];
  onNavigate: (page: string) => void;
  onOpenDetails: (product: Product) => void;
  /** Optional: called when the user clicks a "did you mean" suggestion. */
  onSearch?: (query: string) => void;
}

const ACCENT = "#10B981";

// ---------- Fuzzy matching helpers ----------

/** Classic Levenshtein edit distance between two strings. */
const levenshtein = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
};

/** How many typos we tolerate, scaled to word length. */
const maxDistance = (len: number): number => (len <= 4 ? 1 : len <= 8 ? 2 : 3);

/** Split a string into lowercase alphanumeric tokens. */
const tokenize = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** True if a query word "reasonably" matches a product token (substring or fuzzy). */
const wordMatches = (qWord: string, token: string): { matches: boolean; distance: number } => {
  if (token.includes(qWord) || qWord.includes(token)) {
    return { matches: true, distance: 0 };
  }
  const d = levenshtein(qWord, token);
  return { matches: d <= maxDistance(qWord.length), distance: d };
};

const productHaystackTokens = (p: Product): string[] =>
  tokenize([p.name, p.subtitle, p.brand, p.category].filter(Boolean).join(' '));

// ---------------------------------------------

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  products,
  categories,
  onNavigate,
  onOpenDetails,
  onSearch,
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

  // Products that match the query — exact substring OR fuzzy (typo-tolerant), sorted by relevance
  const matchedProducts = useMemo(() => {
    const qWords = tokenize(query);
    if (qWords.length === 0) return [];

    const scored: { product: Product; score: number }[] = [];

    for (const p of products) {
      if (p.isActive === false) continue;
      const tokens = productHaystackTokens(p);
      let totalScore = 0;
      let allWordsMatch = true;

      for (const qWord of qWords) {
        let bestDistance = Infinity;
        for (const token of tokens) {
          const { matches, distance } = wordMatches(qWord, token);
          if (matches && distance < bestDistance) {
            bestDistance = distance;
            if (bestDistance === 0) break;
          }
        }
        if (bestDistance === Infinity) {
          allWordsMatch = false;
          break;
        }
        totalScore += bestDistance;
      }

      if (allWordsMatch) {
        scored.push({ product: p, score: totalScore });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    return scored.map((s) => s.product);
  }, [query, products]);

  // If nothing matched at all, find the closest known term across the whole catalog
  const suggestion = useMemo(() => {
    if (matchedProducts.length > 0) return null;
    const qWords = tokenize(query);
    if (qWords.length === 0) return null;

    const catalogTokens = new Set<string>();
    products.forEach((p) => {
      productHaystackTokens(p).forEach((t) => catalogTokens.add(t));
    });

    let bestWord = '';
    let bestDistance = Infinity;

    qWords.forEach((qWord) => {
      catalogTokens.forEach((token) => {
        const d = levenshtein(qWord, token);
        // Slightly looser than the match threshold so we can still suggest something
        if (d < bestDistance && d <= maxDistance(qWord.length) + 1 && d > 0) {
          bestDistance = d;
          bestWord = token;
        }
      });
    });

    return bestWord || null;
  }, [matchedProducts, query, products]);

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
    return list; // "popular" — keep relevance order from matching
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
  className="
    group flex items-center gap-3 mb-6 
    px-5 py-2.5 
    rounded-full
    text-xs font-bold tracking-[0.2em] uppercase
    border border-emerald-400/40
    bg-gradient-to-r from-emerald-500/20 via-green-400/10 to-yellow-500/20
    text-emerald-300
    backdrop-blur-md
    shadow-[0_0_20px_rgba(16,185,129,0.25)]
    transition-all duration-300
    hover:scale-105
    hover:text-white
    hover:border-emerald-400
    hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
    cursor-pointer
  "
  style={{ fontFamily: "'DM Sans', sans-serif" }}
>
  <ArrowLeft 
    size={16} 
    className="
      transition-transform duration-300 
      group-hover:-translate-x-1
      text-yellow-400
    " 
  />

  <span>
    Back to Home
  </span>
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
        {matchedProducts.length > 0 && (
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
                Max Price: €. {(maxPrice ?? priceCeiling).toLocaleString()}
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
  <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-3">
    Rating
  </p>

  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() =>
          setMinRating(minRating === star ? 0 : star)
        }
        className="transition-all duration-200 hover:scale-125"
      >
        <Star
          size={22}
          fill={star <= minRating ? "#FFD700" : "none"}
          stroke={star <= minRating ? "#FFD700" : "#666"}
          strokeWidth={2}
        />
      </button>
    ))}
  </div>

  <div className="mt-2 flex items-center justify-between">
    <span className="text-xs text-white/60">
      {minRating
        ? `${minRating} Star${minRating > 1 ? "s" : ""} & Up`
        : "All Ratings"}
    </span>

    {minRating > 0 && (
      <button
        onClick={() => setMinRating(0)}
        className="text-xs text-red-400 hover:text-red-300"
      >
        Clear
      </button>
    )}
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
        )}

        {/* Results */}
        <div className="flex-1">
          {/* Sort Bar */}
          {matchedProducts.length > 0 && (
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
          )}

          {sortedProducts.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center gap-3">
              <SearchX size={32} className="text-white/20" />
              {matchedProducts.length === 0 ? (
                <>
                  <p className="text-white/45 italic text-sm">
                    No products found for "{query}".
                  </p>
                  {suggestion && (
                    <p className="text-sm">
                      <span className="text-white/40">Did you mean </span>
                      {onSearch ? (
                        <button
                          onClick={() => onSearch(suggestion)}
                          className="font-bold underline cursor-pointer"
                          style={{ color: ACCENT }}
                        >
                          "{suggestion}"
                        </button>
                      ) : (
                        <span className="font-bold" style={{ color: ACCENT }}>
                          "{suggestion}"
                        </span>
                      )}
                      <span className="text-white/40">?</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-white/45 italic text-sm">
                  No products match the selected filters.
                </p>
              )}
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