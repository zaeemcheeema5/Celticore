import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { productsService } from "../api/products";
import { Product, Category as CategoryType } from "../types";

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

const AuthModal = lazy(() => import("../components/auth/AuthModal").then((m) => ({ default: m.AuthModal })));
const CartDrawer = lazy(() => import("../components/cart/CartDrawer").then((m) => ({ default: m.CartDrawer })));
const ChatbotWidget = lazy(() => import("../components/chatbot/ChatbotWidget").then((m) => ({ default: m.ChatbotWidget })));
const NutritionModal = lazy(() => import("../components/nutrition/NutritionModal").then((m) => ({ default: m.NutritionModal })));
const WishlistDrawer = lazy(() => import("../components/wishlist/WishlistDrawer").then((m) => ({ default: m.WishlistDrawer })));
const AdminDashboard = lazy(() => import("../components/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const ProductDetailsModal = lazy(() => import("../components/product/ProductDetailsModal").then((m) => ({ default: m.ProductDetailsModal })));
const CheckoutModal = lazy(() => import("../components/cart/CheckoutModal").then((m) => ({ default: m.CheckoutModal })));
const PrivacyPolicyModal = lazy(() => import("../components/common/PrivacyPolicyModal").then((m) => ({ default: m.PrivacyPolicyModal })));

function MainAppLayout() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer Toggles
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNutritionOpen, setIsNutritionOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchNavigate = (query: string) => {
    setSearchQuery(query);
    setCurrentPage("search");
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white/50 text-xs tracking-widest uppercase">
        <svg className="animate-spin h-6 w-6 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading Storefront...
      </div>
    );
  }

  if (currentPage === "admin") {
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
        onOpenNutrition={() => setIsNutritionOpen(true)}
        onSearchNavigate={handleSearchNavigate}
      />

      {/* Core Page Render */}
      <main className="flex-1">
        {currentPage === "home" ? (
         <Home
  onNavigate={handleNavigate}
  categories={categories}
  products={products}
  onOpenDetails={(p) => setSelectedProduct(p)}
/>
        ) : (
          <Suspense fallback={null}>
            {currentPage === "search" ? (
              <SearchResults
                query={searchQuery}
                products={products}
                categories={categories}
                onNavigate={handleNavigate}
                onOpenDetails={(p) => setSelectedProduct(p)}
              />
            ) : currentPage === "my-orders" ? (
              <MyOrders onNavigate={handleNavigate} />
            ) : (
              <Category
                pageId={currentPage}
                categories={categories}
                products={products}
                onNavigate={handleNavigate}
                onOpenDetails={(p) => setSelectedProduct(p)}
              />
            )}
          </Suspense>
        )}
      </main>

      {/* Footer Contact and Brand Info */}
      <Footer
        onOpenNutrition={() => setIsNutritionOpen(true)}
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
        <ChatbotWidget />
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
        />
      </Suspense>
      <Suspense fallback={null}>
        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          onOpenDetails={(p) => setSelectedProduct(p)}
        />
      </Suspense>
      <Suspense fallback={null}>
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <NutritionModal
          isOpen={isNutritionOpen}
          onClose={() => setIsNutritionOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          accent={productModalAccent}
          onRequireAuth={() => setIsAuthOpen(true)}
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