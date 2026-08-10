import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { ShieldAlert } from "lucide-react";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";

import { productsService } from "../api/products";
import { Product, Category as CategoryType } from "../types";

import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { CookieConsent } from "../components/common/CookieConsent";

import { Home } from "../pages/Home";

const Category = lazy(() =>
  import("../pages/Category").then((m) => ({
    default: m.Category,
  }))
);

const SearchResults = lazy(() =>
  import("../pages/SearchResults").then((m) => ({
    default: m.SearchResults,
  }))
);

const MyOrders = lazy(() =>
  import("../pages/MyOrders").then((m) => ({
    default: m.MyOrders,
  }))
);

const ProductPage = lazy(() =>
  import("../pages/ProductPage").then((m) => ({
    default: m.ProductPage,
  }))
);

const AuthModal = lazy(() =>
  import("../components/auth/AuthModal").then((m) => ({
    default: m.AuthModal,
  }))
);

const CartDrawer = lazy(() =>
  import("../components/cart/CartDrawer").then((m) => ({
    default: m.CartDrawer,
  }))
);

const ChatbotWidget = lazy(() =>
  import("../components/chatbot/ChatbotWidget").then((m) => ({
    default: m.ChatbotWidget,
  }))
);

const NutritionModal = lazy(() =>
  import("../components/nutrition/NutritionModal").then((m) => ({
    default: m.NutritionModal,
  }))
);

const WishlistDrawer = lazy(() =>
  import("../components/wishlist/WishlistDrawer").then((m) => ({
    default: m.WishlistDrawer,
  }))
);

const AdminDashboard = lazy(() =>
  import("../components/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  }))
);

const ProductDetailsModal = lazy(() =>
  import("../components/product/ProductDetailsModal").then((m) => ({
    default: m.ProductDetailsModal,
  }))
);

const CheckoutModal = lazy(() =>
  import("../components/cart/CheckoutModal").then((m) => ({
    default: m.CheckoutModal,
  }))
);

const PrivacyPolicyModal = lazy(() =>
  import("../components/common/PrivacyPolicyModal").then((m) => ({
    default: m.PrivacyPolicyModal,
  }))
);


// ============================================================
// URL HELPERS
// ============================================================

function getCurrentPath(): string {
  return window.location.pathname;
}

function getPageFromPath(): string {
  const path = getCurrentPath();

  if (path === "/" || path === "") {
    return "home";
  }

  if (path === "/search") {
    return "search";
  }

  if (path === "/my-orders") {
    return "my-orders";
  }

  if (path === "/nutrition") {
    return "nutrition";
  }

  if (path === "/admin") {
    return "admin";
  }

  if (path.startsWith("/product/")) {
    return "product";
  }

  if (path.startsWith("/category/")) {
    return decodeURIComponent(
      path.replace("/category/", "")
    );
  }

  return decodeURIComponent(
    path.replace(/^\/+/, "")
  ) || "home";
}

function getProductIdFromPath(): string | null {
  const path = getCurrentPath();

  if (!path.startsWith("/product/")) {
    return null;
  }

  const id = path
    .replace("/product/", "")
    .split("/")[0];

  return id || null;
}


// ============================================================
// MAIN APP
// ============================================================

function MainAppLayout() {

  const [currentPage, setCurrentPage] =
    useState<string>(getPageFromPath);

  const {
    isAuthenticated,
    isAdmin,
    loading: authLoading,
  } = useAuth();

  const [categories, setCategories] =
    useState<CategoryType[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);


  // ==========================================================
  // MODALS / DRAWERS
  // ==========================================================

  const [isAuthOpen, setIsAuthOpen] =
    useState(false);

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] =
    useState(false);

  const [isWishlistOpen, setIsWishlistOpen] =
    useState(false);

  const [isPrivacyOpen, setIsPrivacyOpen] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");


  // ==========================================================
  // LOAD CATALOG
  // ==========================================================

  const loadCatalog = async () => {

    try {

      const [cats, prods] =
        await Promise.all([
          productsService.getCategories(),
          productsService.getProducts(),
        ]);

      setCategories(cats);
      setProducts(prods);

    } catch (err) {

      console.error(
        "Failed to load catalog data",
        err
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadCatalog();
  }, []);


  // ==========================================================
  // BROWSER BACK / FORWARD
  // ==========================================================

  useEffect(() => {

    const handlePopState = () => {

      const page =
        getPageFromPath();

      setCurrentPage(page);

      setSelectedProduct(null);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {

      window.removeEventListener(
        "popstate",
        handlePopState
      );

    };

  }, []);


  // ==========================================================
  // NORMAL NAVIGATION
  // ==========================================================

  const handleNavigate = (
    page: string
  ) => {

    let path = "/";

    if (page === "home") {

      path = "/";

    } else if (page === "search") {

      path = "/search";

    } else if (page === "my-orders") {

      path = "/my-orders";

    } else if (page === "nutrition") {

      path = "/nutrition";

    } else if (page === "admin") {

      path = "/admin";

    } else {

      path =
        `/category/${encodeURIComponent(page)}`;

    }

    if (
      window.location.pathname !== path
    ) {

      window.history.pushState(
        { page },
        "",
        path
      );

    }

    setCurrentPage(page);

    setSelectedProduct(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================================
  // PRODUCT NAVIGATION
  // ==========================================================

  const handleProductNavigate = (
    product: Product
  ) => {

    const productId =
      encodeURIComponent(
        String(product.id)
      );

    const path =
      `/product/${productId}`;

    window.history.pushState(
      {
        page: "product",
        productId: product.id,
      },
      "",
      path
    );

    setSelectedProduct(null);

    setCurrentPage("product");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================================
  // SEARCH NAVIGATION
  // ==========================================================

  const handleSearchNavigate = (
    query: string
  ) => {

    setSearchQuery(query);

    const path =
      `/search?q=${encodeURIComponent(query)}`;

    window.history.pushState(
      {
        page: "search",
      },
      "",
      path
    );

    setCurrentPage("search");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================================
  // EXIT ADMIN
  // ==========================================================

  const handleExitAdmin = () => {

    handleNavigate("home");

    loadCatalog();

  };


  // ==========================================================
  // PRODUCT ID
  // ==========================================================

  const productId =
    currentPage === "product"
      ? getProductIdFromPath()
      : null;


  // ==========================================================
  // ACTIVE CATEGORY
  // ==========================================================

  const activeCategory =
    categories.find(
      (c) => c.id === currentPage
    );

  const activeAccentColor =
    activeCategory?.accentColor ||
    "#10B981";


  // ==========================================================
  // PRODUCT MODAL ACCENT
  // ==========================================================

  const selectedProductCategory =
    selectedProduct
      ? categories.find(
          (c) =>
            c.id === selectedProduct.category
        )
      : null;

  const productModalAccent =
    selectedProductCategory?.accentColor ||
    "#10B981";


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">

        <div
          className="text-white text-sm tracking-[0.2em] uppercase"
          style={{
            fontFamily:
              "'Barlow Condensed', sans-serif",
          }}
        >
          Loading CeltiCore...
        </div>

      </div>
    );
  }


  // ==========================================================
  // ADMIN
  // ==========================================================

  if (currentPage === "admin") {

    if (authLoading) {

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">

          <div
            className="text-white text-sm tracking-[0.2em] uppercase"
            style={{
              fontFamily:
                "'Barlow Condensed', sans-serif",
            }}
          >
            Checking Access...
          </div>

        </div>
      );
    }


    if (!isAdmin) {

      return (
        <>

          <Toaster
            position="bottom-left"
            toastOptions={{
              style: {
                background: "#0c0c0c",
                color: "#fff",
                border:
                  "1px solid rgba(255,255,255,0.08)",
              },
            }}
          />

          <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-5 text-center px-4">

            <ShieldAlert
              size={40}
              className="text-emerald-500/70"
            />

            <div>

              <h1
                className="text-white text-lg font-black uppercase tracking-[0.1em]"
                style={{
                  fontFamily:
                    "'Barlow Condensed', sans-serif",
                }}
              >
                Admin Access Required
              </h1>

              <p
                className="text-white/40 text-xs mt-2 max-w-xs mx-auto"
                style={{
                  fontFamily:
                    "'DM Sans', sans-serif",
                }}
              >
                {isAuthenticated
                  ? "This account doesn't have admin privileges."
                  : "Sign in with an administrator account to continue."}
              </p>

            </div>

            <div className="flex items-center gap-4 mt-1">

              <button
                onClick={() =>
                  setIsAuthOpen(true)
                }
                className="px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-black cursor-pointer"
                style={{
                  fontFamily:
                    "'Barlow Condensed', sans-serif",
                  background:
                    "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                }}
              >
                Sign In
              </button>

              <button
                onClick={() =>
                  handleNavigate("home")
                }
                className="text-[11px] text-white/40 hover:text-white/70 uppercase tracking-[0.15em] transition-colors cursor-pointer"
                style={{
                  fontFamily:
                    "'DM Sans', sans-serif",
                }}
              >
                Return to Store
              </button>

            </div>

          </div>

          <Suspense fallback={null}>

            <AuthModal
              isOpen={isAuthOpen}
              onClose={() =>
                setIsAuthOpen(false)
              }
            />

          </Suspense>

        </>
      );
    }


    return (
      <>

        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              background: "#0c0c0c",
              color: "#fff",
              border:
                "1px solid rgba(255,255,255,0.08)",
            },
          }}
        />

        <Suspense fallback={null}>

          <AdminDashboard
            onClose={handleExitAdmin}
            onCatalogChange={loadCatalog}
          />

        </Suspense>

      </>
    );
  }


  // ==========================================================
  // NORMAL WEBSITE
  // ==========================================================

  return (

    <div
      className="min-h-screen bg-[#050505] text-white flex flex-col justify-between overflow-x-hidden"
      style={{
        fontFamily:
          "'DM Sans', sans-serif",
      }}
    >

      <Toaster
        position="bottom-left"
        toastOptions={{
          style: {
            background: "#0c0c0c",
            color: "#fff",
            border:
              "1px solid rgba(255,255,255,0.08)",
          },
        }}
      />


      {/* ====================================================
          NAVBAR
          ==================================================== */}

      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={() =>
          setIsAuthOpen(true)
        }
        onOpenCart={() =>
          setIsCartOpen(true)
        }
        onOpenWishlist={() =>
          setIsWishlistOpen(true)
        }
        onOpenAdmin={() =>
          handleNavigate("admin")
        }
        onOpenNutrition={() =>
          handleNavigate("nutrition")
        }
        onSearchNavigate={
          handleSearchNavigate
        }
      />


      {/* ====================================================
          MAIN CONTENT
          ==================================================== */}

      <main className="flex-1">


        {/* HOME */}

        {currentPage === "home" && (

          <Home
            onNavigate={handleNavigate}
            categories={categories}
            products={products}

            onOpenDetails={(p) =>
              setSelectedProduct(p)
            }

            onProductNavigate={
              handleProductNavigate
            }
          />

        )}


        {/* PRODUCT */}

        {currentPage === "product" &&
          productId && (

            <Suspense
              fallback={
                <div className="min-h-[70vh] flex items-center justify-center">

                  <div
                    className="text-white/50 text-xs uppercase tracking-[0.2em]"
                    style={{
                      fontFamily:
                        "'DM Sans', sans-serif",
                    }}
                  >
                    Loading Product...
                  </div>

                </div>
              }
            >

              <ProductPage
                productId={productId}
                products={products}
                categories={categories}
                onNavigate={handleNavigate}
                onOpenDetails={(p) =>
                  setSelectedProduct(p)
                }
              />

            </Suspense>

          )}


        {/* SEARCH */}

        {currentPage === "search" && (

          <Suspense fallback={null}>

            <SearchResults
              query={searchQuery}
              products={products}
              categories={categories}
              onNavigate={handleNavigate}
              onOpenDetails={(p) =>
                setSelectedProduct(p)
              }
              onProductNavigate={
                handleProductNavigate
              }
            />

          </Suspense>

        )}


        {/* ORDERS */}

        {currentPage === "my-orders" && (

          <Suspense fallback={null}>

            <MyOrders onNavigate={handleNavigate} />

          </Suspense>

        )}


        {/* NUTRITION */}

        {currentPage === "nutrition" && (

          <Suspense fallback={null}>

            <NutritionModal
              onClose={() =>
                handleNavigate("home")
              }
            />

          </Suspense>

        )}


        {/* CATEGORY */}

        {currentPage !== "home" &&
          currentPage !== "product" &&
          currentPage !== "search" &&
          currentPage !== "my-orders" &&
          currentPage !== "nutrition" && (

            <Suspense fallback={null}>

              <Category
                pageId={currentPage}
                categories={categories}
                products={products}
                onNavigate={handleNavigate}
                onOpenDetails={(p) =>
                  setSelectedProduct(p)
                }
                onProductNavigate={
                  handleProductNavigate
                }
              />

            </Suspense>

          )}

      </main>


      {/* ====================================================
          FOOTER
          ==================================================== */}

      <Footer
        onOpenNutrition={() =>
          handleNavigate("nutrition")
        }
        onNavigate={handleNavigate}
        onOpenPrivacy={() =>
          setIsPrivacyOpen(true)
        }
      />


      {/* COOKIE */}

      <CookieConsent
        onOpenPrivacy={() =>
          setIsPrivacyOpen(true)
        }
      />


      {/* PRIVACY */}

      <Suspense fallback={null}>

        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() =>
            setIsPrivacyOpen(false)
          }
        />

      </Suspense>


      {/* CHATBOT */}

      <Suspense fallback={null}>

        <ChatbotWidget
          onProductClick={(p) =>
            handleSearchNavigate(p.name)
          }
        />

      </Suspense>


      {/* AUTH */}

      <Suspense fallback={null}>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() =>
            setIsAuthOpen(false)
          }
        />

      </Suspense>


      {/* CART */}

      <Suspense fallback={null}>

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() =>
            setIsCartOpen(false)
          }
          onOpenCheckout={() =>
            setIsCheckoutOpen(true)
          }
        />

      </Suspense>


      {/* WISHLIST */}

      <Suspense fallback={null}>

        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() =>
            setIsWishlistOpen(false)
          }
          onOpenDetails={(p) =>
            setSelectedProduct(p)
          }
        />

      </Suspense>


      {/* CHECKOUT */}

      <Suspense fallback={null}>

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() =>
            setIsCheckoutOpen(false)
          }
        />

      </Suspense>


      {/* PRODUCT MODAL */}

      <Suspense fallback={null}>

        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
          accent={productModalAccent}
          onRequireAuth={() =>
            setIsAuthOpen(true)
          }
        />

      </Suspense>

    </div>
  );
}


// ============================================================
// PROVIDERS
// ============================================================

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


// ============================================================
// GLOBAL STYLES
// ============================================================

const BASE_STYLES = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) scale(1);
      opacity: 0.5;
    }

    50% {
      transform: translateY(-18px) scale(1.15);
      opacity: 0.9;
    }
  }

  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes shimmer-gold {
    0% {
      background-position: -200% center;
    }

    100% {
      background-position: 200% center;
    }
  }

  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(32px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-32px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fade-up {
    from {
      opacity: 0;
      transform: translateY(24px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes emerald-pulse {
    0%, 100% {
      box-shadow:
        0 0 24px rgba(16,185,129,0.2),
        0 0 60px rgba(16,185,129,0.08);
    }

    50% {
      box-shadow:
        0 0 48px rgba(16,185,129,0.45),
        0 0 100px rgba(16,185,129,0.18);
    }
  }

  @keyframes scan-line {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }

    10% {
      opacity: 1;
    }

    90% {
      opacity: 1;
    }

    100% {
      transform: translateY(100vh);
      opacity: 0;
    }
  }

  .text-gold {
    background:
      linear-gradient(
        90deg,
        #B8860B 0%,
        #D4AF37 35%,
        #F7E98E 50%,
        #D4AF37 65%,
        #B8860B 100%
      );

    background-size: 200% auto;

    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    background-clip: text;

    animation:
      shimmer-gold 4s linear infinite;
  }

  .hero-text-enter {
    animation:
      slide-in-left
      0.65s
      cubic-bezier(0.16,1,0.3,1)
      both;
  }

  .hero-visual-enter {
    animation:
      slide-in-right
      0.65s
      cubic-bezier(0.16,1,0.3,1)
      both;
  }

  .modal-enter {
    animation:
      fade-up
      0.35s
      cubic-bezier(0.16,1,0.3,1)
      both;
  }

  .emerald-btn-glow {
    animation:
      emerald-pulse
      2.5s
      ease-in-out
      infinite;
  }

  .scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .nav-link {
    position: relative;
    color: rgba(255,255,255,0.5);
    transition: color 0.2s;
    font-size: 0.73rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -3px;
    right: 0;
    height: 1px;
    background: #10B981;
    transform: scaleX(0);
    transition: transform 0.25s ease;
  }

  .nav-link:hover {
    color: #fff;
  }

  .nav-link:hover::after {
    transform: scaleX(1);
  }

  .category-card {
    transition:
      transform 0.35s cubic-bezier(0.16,1,0.3,1),
      box-shadow 0.35s ease,
      border-color 0.35s ease;
  }

  .category-card:hover {
    transform: translateY(-5px);
  }
`;