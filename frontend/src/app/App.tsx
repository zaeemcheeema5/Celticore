import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { ShieldAlert } from "lucide-react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider, useCart } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { productsService } from "../api/products";
import { Product, Category as CategoryType } from "../types";
import logoImage from "../assets/logo.webp";
// Layout & Common Components — kept eager since they're needed for the
// very first paint (Navbar/Footer are always visible on every page).
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { CookieConsent } from "../components/common/CookieConsent";

// Home is kept eager (it's the landing page most visitors hit first,
// so code-splitting it would only add a second network round trip to
// the critical path instead of saving anything).
import { Home } from "../pages/Home";

// Everything below is only needed once a user navigates away from Home
// or opens a modal/drawer, so it's code-split with React.lazy. This
// shrinks the initial JS payload — the main lever for mobile
// performance/TBT — without changing any component's behavior; they
// just load on demand instead of all upfront.
const Category = lazy(() => import("../pages/Category").then((m) => ({ default: m.Category })));
const SearchResults = lazy(() => import("../pages/SearchResults").then((m) => ({ default: m.SearchResults })));
const MyOrders = lazy(() => import("../pages/MyOrders").then((m) => ({ default: m.MyOrders })));
const ProductPage = lazy(() => import("../pages/ProductPage").then((m) => ({ default: m.ProductPage })));

const AuthModal = lazy(() => import("../components/auth/AuthModal").then((m) => ({ default: m.AuthModal })));
const CartDrawer = lazy(() => import("../components/cart/CartDrawer").then((m) => ({ default: m.CartDrawer })));
const ChatbotWidget = lazy(() => import("../components/chatbot/ChatbotWidget").then((m) => ({ default: m.ChatbotWidget })));
// NutritionModal is now a full routed page (see currentPage === "nutrition"
// below), not a modal toggle — it renders inline in <main> like Category/
// SearchResults/MyOrders instead of floating at the bottom of the tree.
const NutritionModal = lazy(() => import("../components/nutrition/NutritionModal").then((m) => ({ default: m.NutritionModal })));
const WishlistDrawer = lazy(() => import("../components/wishlist/WishlistDrawer").then((m) => ({ default: m.WishlistDrawer })));
const AdminDashboard = lazy(() => import("../components/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const ProductDetailsModal = lazy(() => import("../components/product/ProductDetailsModal").then((m) => ({ default: m.ProductDetailsModal })));
const CheckoutModal = lazy(() => import("../components/cart/CheckoutModal").then((m) => ({ default: m.CheckoutModal })));
const PrivacyPolicyModal = lazy(() => import("../components/common/PrivacyPolicyModal").then((m) => ({ default: m.PrivacyPolicyModal })));

// ── HISTORY / URL HELPERS ───────────────────────────────────────────────
// Derives the current "page" id from the URL path (e.g. "/category-x" ->
// "category-x"). Falls back to "home" when there is no path segment, which
// keeps the very first load behaving exactly as before (currentPage === "home").
// "/product/<slug>" is a reserved two-segment route (see getProductSlugFromPath)
// and always resolves to the "product" page id.
function getPageFromPath(): string {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return "home";
  if (path.startsWith("product/")) return "product";
  return path;
}

// Reads the slug/id segment out of a "/product/<slug>" URL, so a direct
// visit or refresh of a product page can look up the right product.
function getProductSlugFromPath(): string {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  return path.startsWith("product/") ? path.slice("product/".length) : "";
}

// Reads the `q` query param (only used by the "search" page) so a direct
// visit or refresh of a search URL restores the same search results.
function getSearchQueryFromURL(): string {
  return new URLSearchParams(window.location.search).get("q") || "";
}

// Builds a crawlable path for a given page id (e.g. "home" -> "/",
// "category-x" -> "/category-x") — used instead of "#" + page.
function pathForPage(page: string): string {
  return page === "home" ? "/" : `/${page}`;
}

// Builds a crawlable path for a product (e.g. "/product/emerald-blend").
function pathForProduct(slugOrId: string): string {
  return `/product/${slugOrId}`;
}

function MainAppLayout() {
  // Initialize currentPage from the URL path on first load, so a
  // deep-link or a page refresh lands on the right page instead of
  // always resetting to "home".
  const [currentPage, setCurrentPage] = useState<string>(getPageFromPath);
  // isAdmin/authLoading gate the "admin" page below: AdminDashboard has no
  // auth checks of its own (it starts fetching admin data immediately), so
  // App.tsx is what stops an unauthenticated / non-admin visitor from ever
  // mounting it — including someone who deep-links straight to /admin.
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const { cartItems } = useCart();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer Toggles
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(() =>
    getPageFromPath() === "search" ? getSearchQueryFromURL() : ""
  );
  const [productSlug, setProductSlug] = useState<string>(() =>
    getPageFromPath() === "product" ? getProductSlugFromPath() : ""
  );

  // Load Catalog Data
  const loadCatalog = async () => {
    try {
      const cats = await productsService.getCategories();
      const prods = await productsService.getProducts();
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error("Failed to load catalog data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Create the initial history entry on startup. Using replaceState (not
  // pushState) here means we don't add an extra entry to the stack — we
  // just make sure the entry that's already there carries a `page` state
  // object and a URL path matching whatever page we initialized to above,
  // so popstate has something consistent to compare against later.
  useEffect(() => {
    const path =
      currentPage === "product" && productSlug ? pathForProduct(productSlug) : pathForPage(currentPage);
    const search =
      currentPage === "search" && searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
    window.history.replaceState({ page: currentPage, productSlug }, "", `${path}${search}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize currentPage when the browser Back/Forward buttons are
  // used. We prefer the page stored in event.state (set by our own
  // pushState/replaceState calls below); if that's missing for any
  // reason (e.g. entry created outside our control) we fall back to
  // parsing the URL path.
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;

      // "modal" entries are pushed by handleOpenProductDetails below when a
      // product quick-view is opened from a card (not a full page nav) —
      // navigating (forward) into one of these should just open the modal
      // over whatever page it was pushed on top of, not replace the page.
      if (state && state.modal) {
        setCurrentPage(state.page || getPageFromPath());
        const product = products.find(
          (p) => String(p.id) === String(state.productSlug) || (p as any).slug === state.productSlug
        );
        if (product) setSelectedProduct(product);
        return;
      }

      // Any other history entry means we've navigated away from the modal
      // (if one was open), so make sure it's closed.
      setSelectedProduct(null);

      const page = (state && state.page) || getPageFromPath();
      setCurrentPage(page);
      if (page === "search") {
        setSearchQuery(getSearchQueryFromURL());
      }
      if (page === "product") {
        setProductSlug((state && state.productSlug) || getProductSlugFromPath());
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [products]);

  // Warn before the visitor closes the tab, reloads, or navigates away
  // (typing a new URL, clicking an external link, etc.) while they still
  // have items sitting in their cart. Browsers show their own built-in
  // confirmation dialog here for security reasons — the text can't be
  // customized (any string set on returnValue is ignored by modern
  // Chrome/Firefox/Safari, which display a fixed generic message like
  // "Leave site? Changes you made may not be saved.") — so this only
  // controls WHETHER the prompt appears, not its wording.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cartItems.length === 0) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cartItems.length]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Push a new history entry so Back/Forward can step through pages
    // instead of leaving the site. Skip pushing a duplicate entry if
    // we're already on this page (e.g. re-clicking the active nav link).
    if (page !== currentPage) {
      window.history.pushState({ page }, "", pathForPage(page));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchNavigate = (query: string) => {
    setSearchQuery(query);
    setCurrentPage("search");
    const search = query ? `?q=${encodeURIComponent(query)}` : "";
    window.history.pushState({ page: "search" }, "", `/search${search}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateToProduct = (product: Product) => {
    const slug = (product as any).slug || String(product.id);
    setProductSlug(slug);
    setCurrentPage("product");
    window.history.pushState({ page: "product", productSlug: slug }, "", pathForProduct(slug));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Opens the quick-view product modal AND pushes a "/product/<slug>" URL
  // for it, marked with `modal: true` so popstate (above) knows to reopen
  // the modal — rather than the full ProductPage — when navigated back to.
  const handleOpenProductDetails = (product: Product) => {
    const slug = (product as any).slug || String(product.id);
    setSelectedProduct(product);
    window.history.pushState(
      { modal: true, page: currentPage, productSlug: slug },
      "",
      pathForProduct(slug)
    );
  };

  // Closes the quick-view modal. If the current history entry is the one
  // we pushed for it, step back so the URL returns to whatever page the
  // modal was opened from, instead of leaving a stale "/product/<slug>"
  // URL in the address bar.
  const handleCloseProductDetails = () => {
    setSelectedProduct(null);
    if (window.history.state && window.history.state.modal) {
      window.history.back();
    }
  };

  // "View Full Product Page →" inside the modal. The URL is already
  // "/product/<slug>" (pushed by handleOpenProductDetails), so this just
  // upgrades the current history entry from a modal entry into a real
  // "product" page entry instead of pushing a duplicate one.
  const handleViewFullProductPage = (product: Product) => {
    const slug = (product as any).slug || String(product.id);
    setSelectedProduct(null);
    setProductSlug(slug);
    setCurrentPage("product");
    window.history.replaceState({ page: "product", productSlug: slug }, "", pathForProduct(slug));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExitAdmin = () => {
    handleNavigate("home");
    loadCatalog(); // Reload main app catalog when leaving admin (in case products/categories changed)
  };

  // Determine current active accent color based on context
  const activeCategory = categories.find((c) => c.id === currentPage);
  const activeAccentColor = activeCategory?.accentColor || "#10B981";

  // Accent color for selected product details modal
  const selectedProductCategory = selectedProduct
    ? categories.find((c) => c.id === selectedProduct.category)
    : null;
  const productModalAccent = selectedProductCategory?.accentColor || "#10B981";

 if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <img
          src={logoImage}
          alt="Celti Core"
          className="w-28 h-28 object-contain animate-pulse"
        />
      </div>
    );
  }

  if (currentPage === "admin") {
    // Auth state resolves asynchronously (a cookie check against the
    // server — see AuthContext). While that's in flight we don't yet know
    // whether this is an admin, so show the same loading screen as the
    // rest of the app rather than briefly flashing the "not authorized"
    // gate for a legitimate admin who just refreshed the page.
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
          <img
            src={logoImage}
            alt="Celti Core"
            className="w-28 h-28 object-contain animate-pulse"
          />
        </div>
      );
    }

    // Not an authenticated admin — never mount AdminDashboard. It has no
    // auth checks of its own, so this is the actual gate (the server
    // rejecting unauthenticated API calls is the real security boundary;
    // this is what keeps the UI from being reachable at all).
    if (!isAdmin) {
      return (
        <>
          <Toaster position="bottom-left" toastOptions={{ style: { background: '#0c0c0c', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' } }} />
          <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-5 text-center px-4">
            <ShieldAlert size={40} className="text-emerald-500/70" />
            <div>
              <h1 className="text-white text-lg font-black uppercase tracking-[0.1em]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Admin Access Required
              </h1>
              <p className="text-white/40 text-xs mt-2 max-w-xs mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {isAuthenticated
                  ? "This account doesn't have admin privileges."
                  : "Sign in with an administrator account to continue."}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-black cursor-pointer"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavigate("home")}
                className="text-[11px] text-white/40 hover:text-white/70 uppercase tracking-[0.15em] transition-colors cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Return to Store
              </button>
            </div>
          </div>
          <Suspense fallback={null}>
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => setIsAuthOpen(false)}
            />
          </Suspense>
        </>
      );
    }

    return (
      <>
        <Toaster position="bottom-left" toastOptions={{ style: { background: '#0c0c0c', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' } }} />
        <Suspense fallback={null}>
          <AdminDashboard
            onClose={handleExitAdmin}
            onCatalogChange={loadCatalog}
          />
        </Suspense>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{BASE_STYLES}</style>

      {/* Global Toast Alerts */}
      <Toaster position="bottom-left" toastOptions={{ style: { background: '#0c0c0c', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' } }} />

      {/* Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAdmin={() => handleNavigate("admin")}
        onOpenNutrition={() => handleNavigate("nutrition")}
        onSearchNavigate={handleSearchNavigate}
      />

      {/* Core Page Render */}
      <main className="flex-1">
        {currentPage === "home" ? (
         <Home
  onNavigate={handleNavigate}
  categories={categories}
  products={products}
  onOpenDetails={handleOpenProductDetails}
/>
        ) : (
          <Suspense fallback={null}>
            {currentPage === "search" ? (
              <SearchResults
                query={searchQuery}
                products={products}
                categories={categories}
                onNavigate={handleNavigate}
                onOpenDetails={handleOpenProductDetails}
              />
            ) : currentPage === "my-orders" ? (
              <MyOrders onNavigate={handleNavigate} />
            ) : currentPage === "nutrition" ? (
              <NutritionModal onClose={() => handleNavigate("home")} />
            ) : currentPage === "product" ? (
              <ProductPage
                productId={productSlug}
                products={products}
                categories={categories}
                onNavigate={handleNavigate}
                onOpenDetails={handleOpenProductDetails}
                onRequireAuth={() => setIsAuthOpen(true)}
              />
            ) : (
              <Category
                pageId={currentPage}
                categories={categories}
                products={products}
                onNavigate={handleNavigate}
                onOpenDetails={handleOpenProductDetails}
              />
            )}
          </Suspense>
        )}
      </main>

      {/* Footer Contact and Brand Info */}
      <Footer
        onOpenNutrition={() => handleNavigate("nutrition")}
        onNavigate={handleNavigate}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Cookie disclosure banner (essential cookies only — see CookieConsent.tsx) */}
      <CookieConsent onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      <Suspense fallback={null}>
        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
      </Suspense>

      {/* Floating Chat Widget */}
      <Suspense fallback={null}>
        <ChatbotWidget onProductClick={(p) => handleSearchNavigate(p.name)} />
      </Suspense>

      {/* Modals & Slide-out Drawers */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onOpenDetails={handleOpenProductDetails}
        />
      </Suspense>
      <Suspense fallback={null}>
        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          onOpenDetails={handleOpenProductDetails}
        />
      </Suspense>
      <Suspense fallback={null}>
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={handleCloseProductDetails}
          accent={productModalAccent}
          onRequireAuth={() => setIsAuthOpen(true)}
          onViewFullPage={handleViewFullProductPage}
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <MainAppLayout />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// ── CUSTOM SHARED BASE ANIMATION KEYFRAMES ─────────────────────────────────────────
const BASE_STYLES = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.5; }
    50% { transform: translateY(-18px) scale(1.15); opacity: 0.9; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer-gold {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(32px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slide-in-left {
    from { opacity: 0; transform: translateX(-32px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes emerald-pulse {
    0%, 100% { box-shadow: 0 0 24px rgba(16,185,129,0.2), 0 0 60px rgba(16,185,129,0.08); }
    50% { box-shadow: 0 0 48px rgba(16,185,129,0.45), 0 0 100px rgba(16,185,129,0.18); }
  }
  @keyframes scan-line {
    0% { transform: translateY(-100%); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  .text-gold {
    background: linear-gradient(90deg, #B8860B 0%, #D4AF37 35%, #F7E98E 50%, #D4AF37 65%, #B8860B 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer-gold 4s linear infinite;
  }
  .hero-text-enter { animation: slide-in-left 0.65s cubic-bezier(0.16,1,0.3,1) both; }
  .hero-visual-enter { animation: slide-in-right 0.65s cubic-bezier(0.16,1,0.3,1) both; }
  .modal-enter { animation: fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both; }
  .emerald-btn-glow { animation: emerald-pulse 2.5s ease-in-out infinite; }
  .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .nav-link {
    position: relative; color: rgba(255,255,255,0.5);
    transition: color 0.2s; font-size: 0.73rem;
    letter-spacing: 0.18em; text-transform: uppercase;
    font-family: 'DM Sans', sans-serif; font-weight: 500;
    background: none; border: none; cursor: pointer; padding: 0;
  }
  .nav-link::after { content: ''; position: absolute; left: 0; bottom: -3px; right: 0; height: 1px; background: #10B981; transform: scaleX(0); transition: transform 0.25s ease; }
  .nav-link:hover { color: #fff; }
  .nav-link:hover::after { transform: scaleX(1); }
  .category-card { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease, border-color 0.35s ease; }
  .category-card:hover { transform: translateY(-5px); }
`;