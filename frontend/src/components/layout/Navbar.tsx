import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { productsService } from '../../api/products';
import { Product } from '../../types';
import { Category } from '../../types';
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
  const [shopOpen, setShopOpen] = useState(false);
  const shopCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await productsService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Lock background scroll while the mobile drawer is open, and let Escape
  // close it — both were missing before, so the page would scroll behind
  // the open menu on touch devices.
  useEffect(() => {
    if (mobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  // ── Shop Dropdown Hover Handling ──────────────────────────────
  // Keeps the menu open while the cursor is over the button, the
  // invisible hover bridge, or the dropdown itself, and only closes
  // after a short delay so crossing the gap doesn't hide it.
  const handleShopEnter = () => {
    if (shopCloseTimer.current) {
      clearTimeout(shopCloseTimer.current);
      shopCloseTimer.current = null;
    }
    setShopOpen(true);
  };

  const handleShopLeave = () => {
    shopCloseTimer.current = setTimeout(() => {
      setShopOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (shopCloseTimer.current) clearTimeout(shopCloseTimer.current);
    };
  }, []);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-2.5 sm:py-3.5"
        style={{
          background: 'linear-gradient(180deg, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.85) 100%)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(16,185,129,0.12)',
          // Respect the iPhone notch / status bar and Android cutouts so the
          // logo never sits underneath them when the app runs full-screen /
          // is added to the home screen.
          paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
        }}
      >
        {/* Brand Logo — scales down through the breakpoints instead of
            staying a fixed 58px, so it no longer crowds the icons on
            narrow phones. Same logo.png asset at every size. */}
        <button
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-2 sm:gap-3 md:gap-4 group cursor-pointer shrink-0 min-w-0"
        >
          <div
            className="relative flex items-center justify-center shrink-0 w-9 h-9 sm:w-12 sm:h-12 md:w-[52px] md:h-[52px] lg:w-[58px] lg:h-[58px]"
          >
            {/* Glow */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle, rgba(16,185,129,.22), transparent 70%)',
                filter: 'blur(6px)',
                transform: 'scale(1.15)',
              }}
            />
            <img
              src={logoImage}
              alt="Celti Core Logo"
              className="relative w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(16,185,129,.45)) drop-shadow(0 0 14px rgba(16,185,129,.25))',
              }}
            />
          </div>

          {/* Wordmark — smaller and tighter tracking on phones so it never
              wraps or forces a horizontal scroll; grows into the original
              wide desktop treatment from md up. */}
          <span
            className="uppercase whitespace-nowrap truncate transition-all duration-300 group-hover:text-emerald-300 text-[0.95rem] tracking-[0.10em] sm:text-lg sm:tracking-[0.14em] md:text-xl md:tracking-[0.18em] lg:text-[1.35rem] lg:tracking-[0.22em]"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              color: '#10B981',
              textShadow: '0 0 8px rgba(16,185,129,.30)',
            }}
          >
            CELTI CORE
          </span>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7 xl:gap-9 shrink-0">
          <div className="relative" onMouseEnter={handleShopEnter} onMouseLeave={handleShopLeave}>
            <button className="nav-link flex items-center gap-1">
              Shop
              <ChevronDown size={15} className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Invisible hover bridge — fills the gap between the button and the
                dropdown (matches the dropdown's mt-3 offset) so the pointer never
                leaves this wrapper's hoverable area while crossing it. */}
            <div className="absolute left-0 top-full h-3 w-72" />

            <div
              className={`absolute left-0 top-full mt-3 w-72 rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl overflow-hidden transition-all duration-200 ease-out origin-top ${
                shopOpen
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    handleNavigate(category.slug);
                    setShopOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-emerald-500/10 transition-all text-left"
                >
                  <span className="text-white font-medium">{category.name}</span>
                  <ChevronDown size={14} className="-rotate-90 text-emerald-400" />
                </button>
              ))}

              <div className="border-t border-white/10" />

              <button
                onClick={() => {
                  handleNavigate('products');
                  setShopOpen(false);
                }}
                className="w-full px-5 py-3 text-left font-semibold text-emerald-400 hover:bg-emerald-500/10"
              >
                View All Products →
              </button>
            </div>
          </div>
          <button onClick={onOpenNutrition} className="nav-link">
            Nutrition Consultation
          </button>
          <button
            onClick={() => {
              handleNavigate('home');
              setTimeout(() => {
                document.getElementById('footer-contact')?.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }}
            className="nav-link"
          >
            Contact
          </button>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Search */}
          <div className="relative" ref={searchWrapperRef}>
            {searchOpen ? (
              <div
                className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 rounded"
                style={{
                  border: '1px solid rgba(16,185,129,0.35)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <Search size={15} className="text-emerald-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      onSearchNavigate(searchQuery);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search..."
                  className="bg-transparent outline-none text-xs sm:text-sm text-white placeholder-white/30 w-20 sm:w-40 md:w-48"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Close search"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenSearch}
                className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Search"
                aria-label="Open search"
              >
                <Search size={19} />
              </button>
            )}

            {/* Live Search Dropdown */}
            {searchOpen && searchQuery.trim() && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-80 sm:w-80 max-h-96 overflow-y-auto rounded border border-white/10 bg-[#0d0d0d] shadow-xl z-50">
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
                              <span className="text-[0.65rem] text-white/30 uppercase tracking-wide truncate">
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
            className="relative flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart size={19} className={wishlistItems.length > 0 ? 'fill-red-500 text-red-500' : ''} />
            {wishlistItems.length > 0 && (
              <span
                className="absolute top-0.5 right-0.5 flex items-center justify-center rounded-full font-black animate-pulse"
                style={{ background: '#EF4444', color: '#fff', width: 16, height: 16, fontSize: 9 }}
              >
                {wishlistItems.length}
              </span>
            )}
          </button>

          {/* Shopping Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Cart"
            aria-label="Cart"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 flex items-center justify-center rounded-full font-black"
                style={{ background: '#10B981', color: '#000', width: 16, height: 16, fontSize: 9 }}
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
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-emerald-500/25 bg-emerald-500/5 rounded"
              >
                <User size={13} />
                <span className="hidden sm:inline max-w-[9rem] truncate">{user?.name}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                />
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
              className="hidden md:inline-flex items-center gap-2 px-4 lg:px-5 py-2 text-[0.68rem] lg:text-[0.7rem] font-bold tracking-[0.14em] lg:tracking-[0.18em] uppercase transition-all duration-250 cursor-pointer"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                border: '1px solid #10B981',
                color: '#10B981',
                background: 'rgba(16,185,129,0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.06)';
                e.currentTarget.style.color = '#10B981';
              }}
            >
              Login / Sign Up
            </button>
          )}

          {/* Mobile Menu Toggle — 44px+ touch target on phones/tablets */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 -mr-1 text-white/60 hover:text-white transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile / Tablet Drawer — a fully self-contained full-screen overlay
          (its own header + scroll area) instead of being positioned
          relative to the nav's height. That removes the old top-16 /
          calc(100vh - 4rem) guesswork, which broke whenever the nav's
          actual rendered height differed from 64px (e.g. on iPhones with
          the notch, or once the logo/wordmark sizes above started scaling
          per-breakpoint). Categories now come from the same fetched
          `categories` list the desktop dropdown uses, instead of a
          hardcoded slug array that could drift out of sync. */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex flex-col"
          style={{ background: 'rgba(5,5,5,0.98)', backdropFilter: 'blur(20px)' }}
        >
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-3"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            }}
          >
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <img src={logoImage} alt="Celti Core Logo" className="w-8 h-8 object-contain" />
              <span
                className="uppercase text-sm tracking-[0.14em] text-emerald-400"
                style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
              >
                CELTI CORE
              </span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-10 h-10 text-white/70 hover:text-white cursor-pointer"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-4 sm:gap-5 py-8 px-4"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleNavigate(category.slug)}
                className="text-xl sm:text-2xl font-black tracking-[0.1em] uppercase hover:text-emerald-400 transition-colors text-white cursor-pointer text-center px-4"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {category.name}
              </button>
            ))}

            <button
              onClick={() => handleNavigate('products')}
              className="text-xl sm:text-2xl font-black tracking-[0.1em] uppercase hover:text-emerald-400 transition-colors text-emerald-400 cursor-pointer text-center px-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              View All Products
            </button>

            <button
              onClick={onOpenNutrition}
              className="text-base sm:text-lg font-black tracking-[0.1em] uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer mt-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Nutrition Consultation
            </button>

            <button
              onClick={() => {
                handleNavigate('home');
                setTimeout(() => {
                  document.getElementById('footer-contact')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
              className="text-base sm:text-lg font-black tracking-[0.1em] uppercase text-white/70 hover:text-emerald-400 transition-colors cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Contact
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="mt-4 px-10 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
                style={{
                  border: '1px solid #10B981',
                  color: '#10B981',
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};