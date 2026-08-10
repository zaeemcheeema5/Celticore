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
  ChevronRight,
  Search,
  Package,
  Shield,
  Zap,
  Droplets,
  Sun,
  Leaf,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { productsService } from '../../api/products';
import { Product } from '../../types';
import { Category } from '../../types';
import logoImage from '../../assets/logo.webp';

// Same icon mapping used on the Home page's category tiles, so the drawer
// list reads as one consistent system rather than plain text rows.
const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'protein': return Shield;
    case 'creatine': return Zap;
    case 'eaa-bcaa': return Droplets;
    case 'vitamins': return Sun;
    case 'pre-workout': return Zap;
    case 'wellbeing': return Leaf;
    default: return Sparkles;
  }
};

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
  const [drawerVisible, setDrawerVisible] = useState(false);
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
      const raf = requestAnimationFrame(() => setDrawerVisible(true));
      return () => {
        document.body.style.overflow = previousOverflow;
        cancelAnimationFrame(raf);
      };
    }
    setDrawerVisible(false);
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

  // These two open overlays (not `page` navigations), so they were never
  // routed through `handleNavigate` — which meant the mobile drawer stayed
  // open underneath the Nutrition / Admin overlay until manually closed.
  // Close the drawer first, then trigger the overlay, same as every other
  // drawer item does.
  const handleMobileNutritionClick = () => {
    setMobileMenuOpen(false);
    onOpenNutrition();
  };

  const handleMobileAdminClick = () => {
    setMobileMenuOpen(false);
    onOpenAdmin();
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
            narrow phones. Same logo.webp asset at every size. */}
        <button
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-2 sm:gap-3 md:gap-4 group cursor-pointer shrink-0 min-w-0"
        >
          <div
            className="relative flex items-center justify-center shrink-0 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-[52px] lg:h-[52px] xl:w-[58px] xl:h-[58px]"
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
              wide desktop treatment from lg up. Truncates with an ellipsis
              rather than overflowing if the viewport is extremely narrow. */}
          <span
            className="uppercase whitespace-nowrap truncate transition-all duration-300 group-hover:text-emerald-300 text-[0.82rem] tracking-[0.08em] xs:text-[0.95rem] xs:tracking-[0.10em] sm:text-base sm:tracking-[0.12em] md:text-lg md:tracking-[0.15em] lg:text-xl lg:tracking-[0.18em] xl:text-[1.35rem] xl:tracking-[0.22em]"
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

        {/* Desktop Links — only from lg (≈1024px) up. Tablets (iPad
            portrait/landscape, most Android tablets sit between 768–1024px)
            fall back to the drawer instead, since "Nutrition Consultation"
            plus "Shop"/"Contact" plus the icon cluster don't comfortably
            fit at md widths without wrapping or crowding the icons. */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-9 shrink-0">
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
          <button onClick={onOpenNutrition} className="nav-link whitespace-nowrap">
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
        <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 md:gap-2.5 shrink-0">
          {/* Search */}
          <div className="relative" ref={searchWrapperRef}>
            {searchOpen ? (
              <div
                className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-1.5 rounded"
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
                  className="bg-transparent outline-none text-xs sm:text-sm text-white placeholder-white/30 w-16 xs:w-20 sm:w-40 md:w-48"
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
                className="flex items-center justify-center w-9 h-9 sm:w-9 sm:h-9 text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Search"
                aria-label="Open search"
              >
                <Search size={18} className="sm:hidden" />
                <Search size={19} className="hidden sm:block" />
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
            className="relative flex items-center justify-center w-9 h-9 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart size={18} className={`sm:hidden ${wishlistItems.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            <Heart size={19} className={`hidden sm:block ${wishlistItems.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
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
            className="relative flex items-center justify-center w-9 h-9 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Cart"
            aria-label="Cart"
          >
            <ShoppingCart size={18} className="sm:hidden" />
            <ShoppingCart size={19} className="hidden sm:block" />
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
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 text-xs font-semibold tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-emerald-500/25 bg-emerald-500/5 rounded"
              >
                <User size={13} />
                <span className="hidden md:inline max-w-[7rem] lg:max-w-[9rem] truncate">{user?.name}</span>
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
                      onNavigate('my-orders');
                      setProfileDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Package size={14} className="text-emerald-400" />
                    My Orders
                  </button>
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
              className="hidden lg:inline-flex items-center gap-2 px-4 xl:px-5 py-2 text-[0.68rem] xl:text-[0.7rem] font-bold tracking-[0.14em] xl:tracking-[0.18em] uppercase transition-all duration-250 cursor-pointer"
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

          {/* Mobile Menu Toggle — 44px+ touch target, visible through tablet
              sizes now (up to lg) since the full desktop link row only
              shows from lg up. */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 -mr-1 text-white/60 hover:text-white transition-colors cursor-pointer"
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
          hardcoded slug array that could drift out of sync. Now covers
          everything below lg, so tablets (iPad, Android tablets) get this
          drawer too instead of a squeezed inline nav. */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] flex flex-col overflow-hidden"
          style={{ background: '#050505' }}
        >
          {/* Ambient brand glow — same emerald identity as the rest of the
              site instead of flat black, so the drawer doesn't feel like a
              placeholder screen. */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute rounded-full blur-[90px] opacity-[0.16]"
              style={{ width: 360, height: 360, background: '#10B981', top: '-8%', left: '-15%' }}
            />
            <div
              className="absolute rounded-full blur-[100px] opacity-[0.10]"
              style={{ width: 320, height: 320, background: '#10B981', bottom: '5%', right: '-12%' }}
            />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
          </div>

          {/* Header */}
          <div
            className="relative flex items-center justify-between px-4 sm:px-6 py-3"
            style={{
              borderBottom: '1px solid rgba(16,185,129,0.14)',
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            }}
          >
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                <div
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(circle, rgba(16,185,129,.3), transparent 70%)', filter: 'blur(5px)', transform: 'scale(1.3)' }}
                />
                <img src={logoImage} alt="Celti Core Logo" className="relative w-8 h-8 object-contain" />
              </div>
              <span
                className="uppercase text-sm tracking-[0.14em] text-emerald-400"
                style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, textShadow: '0 0 8px rgba(16,185,129,.3)' }}
              >
                CELTI CORE
              </span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable menu body */}
          <div
            className="relative flex-1 overflow-y-auto px-3 sm:px-4 pt-5 pb-4"
          >
            <p
              className="px-3 mb-2 text-[10px] font-bold tracking-[0.35em] uppercase text-white/30"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Shop
            </p>

            <div className="flex flex-col gap-1">
              {categories.map((category, idx) => {
                const Icon = getCategoryIcon(category.id);
                return (
                  <div
                    key={category.id}
                    className="transition-all ease-out"
                    style={{
                      transitionDuration: '450ms',
                      transitionDelay: `${idx * 45}ms`,
                      opacity: drawerVisible ? 1 : 0,
                      transform: drawerVisible ? 'translateY(0)' : 'translateY(10px)',
                    }}
                  >
                    <button
                      onClick={() => handleNavigate(category.slug)}
                      className="group w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-colors duration-200 hover:bg-white/[0.04] active:bg-emerald-500/10 cursor-pointer"
                    >
                      <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-white/[0.04] border border-white/10 transition-colors duration-200 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10">
                        <Icon size={17} className="text-white/60 transition-colors duration-200 group-hover:text-emerald-400" />
                      </span>
                      <span
                        className="flex-1 text-left text-[0.95rem] font-bold tracking-[0.06em] uppercase text-white/85 transition-colors duration-200 group-hover:text-white"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {category.name}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-white/20 shrink-0 transition-all duration-200 group-hover:text-emerald-400 group-hover:translate-x-0.5"
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Highlighted "view all" row */}
            <div
              className="transition-all ease-out mt-1.5"
              style={{
                transitionDuration: '450ms',
                transitionDelay: `${categories.length * 45}ms`,
                opacity: drawerVisible ? 1 : 0,
                transform: drawerVisible ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              <button
                onClick={() => handleNavigate('products')}
                className="group w-full flex items-center gap-3.5 px-3 py-3 rounded-xl cursor-pointer transition-colors duration-200"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)' }}
                >
                  <Sparkles size={17} className="text-emerald-400" />
                </span>
                <span
                  className="flex-1 text-left text-[0.95rem] font-black tracking-[0.06em] uppercase text-emerald-400"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  View All Products
                </span>
                <ChevronRight size={16} className="text-emerald-400/60 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Divider */}
            <div
              className="h-px my-5 mx-3"
              style={{ background: 'linear-gradient(to right, transparent, rgba(16,185,129,0.3), transparent)' }}
            />

            <p
              className="px-3 mb-2 text-[10px] font-bold tracking-[0.35em] uppercase text-white/30"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              More
            </p>

            <div className="flex flex-col gap-1">
              {[
                { icon: Leaf, label: 'Nutrition Consultation', onClick: handleMobileNutritionClick },
                {
                  icon: MessageCircle,
                  label: 'Contact',
                  onClick: () => {
                    handleNavigate('home');
                    setTimeout(() => {
                      document.getElementById('footer-contact')?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  },
                },
                ...(isAuthenticated
                  ? [
                      { icon: Package, label: 'My Orders', onClick: () => handleNavigate('my-orders') },
                      ...(isAdmin ? [{ icon: Settings, label: 'Admin Dashboard', onClick: handleMobileAdminClick }] : []),
                    ]
                  : []),
              ].map((item, i) => {
                const Icon = item.icon;
                const idx = categories.length + 1 + i;
                return (
                  <div
                    key={item.label}
                    className="transition-all ease-out"
                    style={{
                      transitionDuration: '450ms',
                      transitionDelay: `${idx * 45}ms`,
                      opacity: drawerVisible ? 1 : 0,
                      transform: drawerVisible ? 'translateY(0)' : 'translateY(10px)',
                    }}
                  >
                    <button
                      onClick={item.onClick}
                      className="group w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-colors duration-200 hover:bg-white/[0.04] active:bg-emerald-500/10 cursor-pointer"
                    >
                      <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-white/[0.04] border border-white/10 transition-colors duration-200 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10">
                        <Icon size={16} className="text-white/60 transition-colors duration-200 group-hover:text-emerald-400" />
                      </span>
                      <span
                        className="flex-1 text-left text-[0.9rem] font-bold tracking-[0.06em] uppercase text-white/70 transition-colors duration-200 group-hover:text-white"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {item.label}
                      </span>
                      <ChevronRight size={15} className="text-white/15 shrink-0 transition-all duration-200 group-hover:text-emerald-400 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                );
              })}

              {isAuthenticated && (
                <div
                  className="transition-all ease-out"
                  style={{
                    transitionDuration: '450ms',
                    transitionDelay: `${(categories.length + 4) * 45}ms`,
                    opacity: drawerVisible ? 1 : 0,
                    transform: drawerVisible ? 'translateY(0)' : 'translateY(10px)',
                  }}
                >
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="group w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-colors duration-200 hover:bg-red-500/[0.06] active:bg-red-500/10 cursor-pointer"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-white/[0.04] border border-white/10 transition-colors duration-200 group-hover:border-red-500/40 group-hover:bg-red-500/10">
                      <LogOut size={16} className="text-white/60 transition-colors duration-200 group-hover:text-red-400" />
                    </span>
                    <span
                      className="flex-1 text-left text-[0.9rem] font-bold tracking-[0.06em] uppercase text-white/70 transition-colors duration-200 group-hover:text-red-400"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      Logout
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sticky footer — account summary or login CTA, pinned below the
              scroll area with safe-area padding for gesture-nav phones. */}
          <div
            className="relative px-4 sm:px-6 pt-3"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            }}
          >
            {isAuthenticated ? (
              <div className="flex items-center gap-3 py-2.5">
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <User size={17} className="text-emerald-400" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {user?.name || 'My Account'}
                  </p>
                  <p className="text-[11px] text-white/35">Signed in</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3.5 text-sm font-black tracking-[0.2em] uppercase cursor-pointer transition-all duration-250"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  background: 'linear-gradient(135deg, #10B981, #0d9668)',
                  color: '#000',
                  boxShadow: '0 0 24px rgba(16,185,129,0.35)',
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