import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Heart, User, LogOut, Settings, Menu, X, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { productsService } from '../../api/products';
import { Product } from '../../types';

import logoImage from '../../assets/logo.png';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: any) => void;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
  onOpenNutrition: () => void;
  onSearchNavigate: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAuth,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  onOpenNutrition,
  onSearchNavigate,
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // ── Live Search State ─────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const MAX_DROPDOWN_RESULTS = 5;

  // Lazy-load the product catalog the first time the search box is opened
  const ensureProductsLoaded = async () => {
    if (allProducts.length > 0) return;
    try {
      setSearchLoading(true);
      const prods = await productsService.getProducts();
      setAllProducts(prods);
    } catch (err) {
      console.error('Failed to load products for search', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }
    const filtered = allProducts.filter((p) => {
      const haystack = [p.name, p.subtitle, p.brand, p.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
    setSearchResults(filtered);
  }, [searchQuery, allProducts]);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSearch = () => {
    setSearchOpen(true);
    ensureProductsLoaded();
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

const handleSelectSearchResult = (product: Product) => {
  setSearchOpen(false);
  setSearchQuery('');

  // Open the Search Results page
  onSearchNavigate(product.name);
};

  const handleNavigate = (page: any) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-16 py-3 sm:py-4"
      style={{
        background: "linear-gradient(180deg, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.85) 100%)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(16,185,129,0.12)",
      }}
    >
      {/* Brand Logo */}
      <button onClick={() => handleNavigate("home")} className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer shrink-0">
        <img
          src={logoImage}
          alt="Celti Core Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 object-contain rounded-full border border-emerald-500/30"
          style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
        />
        <span
          className="text-[0.95rem] sm:text-[1.1rem] font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase whitespace-nowrap"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            background: "linear-gradient(120deg, #ffffff 0%, #10B981 55%, #D4AF37 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Celti Core
        </span>
      </button>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-9">
        <button onClick={() => handleNavigate("home")} className="nav-link">Shop</button>
        <button onClick={onOpenNutrition} className="nav-link">Nutrition Consultation</button>
        <button onClick={() => {
          handleNavigate("home");
          setTimeout(() => {
            document.getElementById('footer-contact')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }} className="nav-link">Contact</button>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Search */}
        <div className="relative" ref={searchWrapperRef}>
          {searchOpen ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded"
              style={{
                border: "1px solid rgba(16,185,129,0.35)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Search size={15} className="text-emerald-400 shrink-0" />
             <input
  ref={searchInputRef}
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      onSearchNavigate(searchQuery);
      setSearchOpen(false);
    }
  }}
  placeholder="Search products..."
  className="bg-transparent outline-none text-xs sm:text-sm text-white placeholder-white/30 w-28 sm:w-48"
/>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenSearch}
              className="p-2.5 sm:p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Search"
            >
              <Search size={19} />
            </button>
          )}

          {/* Live Search Dropdown */}
          {searchOpen && searchQuery.trim() && (
            <div
              className="absolute right-0 mt-2 w-72 sm:w-80 max-h-96 overflow-y-auto rounded border border-white/10 bg-[#0d0d0d] shadow-xl z-50"
            >
              {searchLoading ? (
                <div className="px-4 py-6 text-center text-xs text-white/40">Loading products...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-white/40">
                  No products found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {searchResults.slice(0, MAX_DROPDOWN_RESULTS).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectSearchResult(product)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-b-0"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded shrink-0 bg-white/5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[0.7rem] text-emerald-400 font-bold">
                            Rs. {product.price?.toLocaleString?.() ?? product.price}
                          </span>
                          {product.category && (
                            <span className="text-[0.65rem] text-white/30 uppercase tracking-wide">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {searchResults.length > MAX_DROPDOWN_RESULTS && (
                   <button
  onClick={() => {
    onSearchNavigate(searchQuery);
    setSearchOpen(false);
  }}
  className="w-full px-3 py-2.5 text-center text-[0.7rem] text-emerald-400 font-semibold tracking-wide hover:bg-white/5 transition-colors cursor-pointer"
>
  View all {searchResults.length} products →
</button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Wishlist Icon */}
        <button
          onClick={onOpenWishlist}
          className="relative p-2.5 sm:p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Wishlist"
        >
          <Heart size={19} className={wishlistItems.length > 0 ? "fill-red-500 text-red-500" : ""} />
          {wishlistItems.length > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-[9px] flex items-center justify-center font-black animate-pulse"
              style={{ background: "#EF4444", color: "#fff" }}
            >
              {wishlistItems.length}
            </span>
          )}
        </button>

        {/* Shopping Cart Icon */}
        <button
          onClick={onOpenCart}
          className="relative p-2.5 sm:p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Cart"
        >
          <ShoppingCart size={19} />
          {cartCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-[9px] flex items-center justify-center font-black"
              style={{ background: "#10B981", color: "#000" }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* Auth Dropdown or Button */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-emerald-500/25 bg-emerald-500/5 rounded"
            >
              <User size={13} />
              <span className="hidden sm:inline">{user?.name}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded border border-white/10 bg-[#0d0d0d] p-1 shadow-xl z-50"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                {isAdmin && (
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setProfileDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Settings size={14} className="text-emerald-400" />
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-[0.7rem] font-bold tracking-[0.18em] uppercase transition-all duration-250 cursor-pointer"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              border: "1px solid #10B981",
              color: "#10B981",
              background: "rgba(16,185,129,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#10B981";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(16,185,129,0.06)";
              e.currentTarget.style.color = "#10B981";
            }}
          >
            Login / Sign Up
          </button>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2.5 -mr-1 text-white/60 hover:text-white transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 flex flex-col items-center justify-center gap-4 sm:gap-6 overflow-y-auto py-8"
          style={{
            background: "rgba(5,5,5,0.98)",
            backdropFilter: "blur(20px)",
            height: "calc(100vh - 4rem)",
          }}
        >
          {["protein", "creatine", "eaa-bcaa", "vitamins", "pre-workout", "wellbeing"].map((p) => (
            <button
              key={p}
              onClick={() => handleNavigate(p)}
              className="text-xl sm:text-2.5xl font-black tracking-[0.12em] uppercase hover:text-emerald-400 transition-colors text-white cursor-pointer text-center px-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {p.replace('-', ' ')}
            </button>
          ))}
          
          <button
            onClick={onOpenNutrition}
            className="text-lg font-black tracking-[0.12em] uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Nutrition Consultation
          </button>

          {!isAuthenticated && (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="mt-4 px-10 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
              style={{
                border: "1px solid #10B981",
                color: "#10B981",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
};