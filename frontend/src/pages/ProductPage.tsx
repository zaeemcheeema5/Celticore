import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Heart, ShoppingBag, Star } from "lucide-react";
import { Product, Category as CategoryType } from "../types";
import { productsService } from "../api/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ReviewsSection } from "../components/product/ReviewsSection";
import { setNoIndex } from "../utils/seo";

interface ProductPageProps {
  productId: string;
  products: Product[];
  categories: CategoryType[];
  onNavigate: (page: string) => void;
  onOpenDetails: (product: Product) => void;
  // Opens the site's auth modal — ReviewsSection needs this to prompt
  // sign-in before letting a visitor write a review or mark one helpful.
  onRequireAuth: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  productId,
  products,
  categories,
  onNavigate,
  onRequireAuth,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [quantity, setQuantity] =
    useState(1);

  const [selectedFlavour, setSelectedFlavour] =
    useState("");

  const [added, setAdded] =
    useState(false);


  // ==========================================================
  // FIND CATEGORY
  // ==========================================================

  const category = product
    ? categories.find(
        (c) => c.id === product.category
      )
    : null;

  const accent =
    category?.accentColor || "#10B981";


  // ==========================================================
  // LOAD PRODUCT
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);
      setError(false);

      try {
        /*
         * First try the products already loaded in App.tsx.
         * This avoids an unnecessary API request when possible.
         */

        const existingProduct =
          products.find(
            (p) =>
              String(p.id) ===
                String(productId) ||
              (p as any).slug ===
                productId
          );

        if (existingProduct) {

          if (!cancelled) {
            setProduct(existingProduct);

            if (
              existingProduct.flavours &&
              existingProduct.flavours.length > 0
            ) {
              setSelectedFlavour(
                existingProduct.flavours[0]
              );
            }

            setLoading(false);
          }

          return;
        }


        /*
         * If the product isn't in the already-loaded
         * catalog, fetch it directly from the API.
         */

        const fetchedProduct =
          await productsService.getProduct(
            productId
          );

        if (!cancelled) {

          setProduct(fetchedProduct);

          if (
            fetchedProduct.flavours &&
            fetchedProduct.flavours.length > 0
          ) {
            setSelectedFlavour(
              fetchedProduct.flavours[0]
            );
          }

          setLoading(false);
        }

      } catch (err) {

        console.error(
          "Failed to load product",
          err
        );

        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };

  }, [productId, products]);


  // ==========================================================
  // SCROLL TO TOP
  // ==========================================================

  useEffect(() => {

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

  }, [productId]);


  // ==========================================================
  // SOFT-404: the SPA fallback returns HTTP 200 for a dead
  // /product/:id URL just like it does for a real one — tell
  // crawlers not to index this state while it's showing. See
  // utils/seo.ts for the full explanation.
  // ==========================================================

  useEffect(() => {
    const notFound = !loading && (error || !product);
    setNoIndex(notFound);
    return () => setNoIndex(false);
  }, [loading, error, product]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <section className="min-h-[70vh] bg-[#050505] flex items-center justify-center">

        <div
          className="text-white/50 text-xs uppercase tracking-[0.25em]"
          style={{
            fontFamily:
              "'DM Sans', sans-serif",
          }}
        >
          Loading Product...
        </div>

      </section>
    );
  }


  // ==========================================================
  // PRODUCT NOT FOUND
  // ==========================================================

  if (error || !product) {

    return (
      <section className="min-h-[70vh] bg-[#050505] flex flex-col items-center justify-center px-6 text-center">

        <h1
          className="text-white text-3xl font-black uppercase"
          style={{
            fontFamily:
              "'Barlow Condensed', sans-serif",
          }}
        >
          Product Not Found
        </h1>

        <p
          className="text-white/40 text-sm mt-3 max-w-md"
          style={{
            fontFamily:
              "'DM Sans', sans-serif",
          }}
        >
          The product you're looking for
          doesn't exist or is no longer
          available.
        </p>

        <button
          type="button"
          onClick={() =>
            onNavigate("home")
          }
          className="mt-7 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-black cursor-pointer"
          style={{
            background: accent,
            fontFamily:
              "'DM Sans', sans-serif",
          }}
        >
          Back To Store
        </button>

      </section>
    );
  }


  // ==========================================================
  // PRODUCT DATA
  // ==========================================================

  const isOutOfStock =
    product.stockQuantity === 0;

  const maxStock =
    product.stockQuantity !== undefined
      ? product.stockQuantity
      : 99;

  const isWishlisted =
    isInWishlist(product.id);

  const flavours =
    product.flavours || [];

  const rating =
    Number(product.rating || 0);

  const reviewCount =
    Number(product.reviews || 0);


  // ==========================================================
  // STOCK MESSAGE
  // ==========================================================

  const lowStock =
    product.stockQuantity !== undefined &&
    product.stockQuantity > 0 &&
    product.stockQuantity <=
      (product.lowStockThreshold ?? 10);


  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = () => {

    if (isOutOfStock) {
      return;
    }

    addToCart(
      product,
      quantity,
      selectedFlavour ||
        flavours[0] ||
        "Unflavoured"
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };


  // ==========================================================
  // QUANTITY
  // ==========================================================

  const increaseQuantity = () => {

    setQuantity((current) =>
      Math.min(
        current + 1,
        maxStock
      )
    );
  };

  const decreaseQuantity = () => {

    setQuantity((current) =>
      Math.max(
        1,
        current - 1
      )
    );
  };


  // ==========================================================
  // BREADCRUMB
  // ==========================================================

  const handleCategoryClick = () => {

    if (product.category) {
      onNavigate(product.category);
    } else {
      onNavigate("home");
    }

  };


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main
      className="bg-[#050505] text-white min-h-screen"
      itemScope
      itemType="https://schema.org/Product"
    >

      {/* ====================================================
          SEO STRUCTURED DATA
          ==================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context":
              "https://schema.org",
            "@type": "Product",

            name: product.name,

            description:
              product.description ||
              product.subtitle ||
              `${product.name} by ${product.brand || "CeltiCore"}`,

            image: [
              product.image,
            ],

            sku: String(product.id),

            brand: {
              "@type":
                "Brand",
              name:
                product.brand ||
                "CeltiCore",
            },

            offers: {
              "@type":
                "Offer",

              url:
                `${window.location.origin}/product/${encodeURIComponent(
                  String((product as any).slug || product.id)
                )}`,

              priceCurrency:
                "EUR",

              price:
                Number(product.price).toFixed(2),

              availability:
                isOutOfStock
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",

              itemCondition:
                "https://schema.org/NewCondition",
            },

            ...(rating > 0 &&
            reviewCount > 0
              ? {
                  aggregateRating: {
                    "@type":
                      "AggregateRating",

                    ratingValue:
                      rating,

                    reviewCount:
                      reviewCount,
                  },
                }
              : {}),
          }),
        }}
      />


      {/* ====================================================
          BREADCRUMB
          ==================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-14 lg:px-20 pt-20 sm:pt-24">

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-[11px] text-white/40"
        >

          <button
            type="button"
            onClick={() =>
              onNavigate("home")
            }
            className="hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>

          <span>/</span>

          {category && (
            <>
              <button
                type="button"
                onClick={
                  handleCategoryClick
                }
                className="hover:text-white transition-colors cursor-pointer"
              >
                {category.name}
              </button>

              <span>/</span>
            </>
          )}

          <span className="text-white/70 truncate max-w-[220px]">
            {product.name}
          </span>

        </nav>

      </div>


      {/* ====================================================
          PRODUCT CONTENT
          ==================================================== */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-14 lg:px-20 py-8 sm:py-12">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">


          {/* ==================================================
              IMAGE
              ================================================== */}

          <div>

            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                background:
                  "#f2ede6",
                aspectRatio:
                  "1 / 1",
              }}
            >

              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                itemProp="image"
              />


              {/* BADGE */}

              {product.badge && (
                <div
                  className="absolute top-5 left-5 px-4 py-2 rounded-full text-[11px] font-bold text-neutral-900"
                  style={{
                    background:
                      "rgba(255,255,255,0.95)",
                  }}
                >
                  {product.badge}
                </div>
              )}


              {/* WISHLIST */}

              <button
                type="button"
                onClick={() =>
                  toggleWishlist(product)
                }
                aria-label={
                  isWishlisted
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                className="absolute top-5 right-5 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  background:
                    "rgba(255,255,255,0.95)",
                }}
              >

                <Heart
                  size={19}
                  className={
                    isWishlisted
                      ? "fill-red-500 text-red-500"
                      : "text-neutral-800"
                  }
                />

              </button>

            </div>

          </div>


          {/* ==================================================
              PRODUCT INFORMATION
              ================================================== */}

          <div className="flex flex-col justify-center">

            {/* BRAND */}

            {product.brand && (
              <p
                className="text-xs uppercase tracking-[0.22em] mb-3"
                style={{
                  color: accent,
                  fontFamily:
                    "'DM Sans', sans-serif",
                }}
              >
                {product.brand}
              </p>
            )}


            {/* PRODUCT NAME */}

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] text-white"
              style={{
                fontFamily:
                  "'Barlow Condensed', sans-serif",
              }}
              itemProp="name"
            >
              {product.name}
            </h1>


            {/* SUBTITLE */}

            {product.subtitle && (
              <p
                className="mt-4 text-base text-white/50"
                style={{
                  fontFamily:
                    "'DM Sans', sans-serif",
                }}
              >
                {product.subtitle}
              </p>
            )}


            {/* RATING */}

            <div className="flex items-center gap-3 mt-5">

              <div className="flex items-center gap-1">

                {Array.from({
                  length: 5,
                }).map((_, index) => (

                  <Star
                    key={index}
                    size={15}
                    fill={
                      index <
                      Math.round(rating)
                        ? "#D4AF37"
                        : "transparent"
                    }
                    stroke="#D4AF37"
                  />

                ))}

              </div>

              <span
                className="text-sm text-white/60"
                itemProp="aggregateRating"
              >
                {rating.toFixed(1)}
              </span>

              {reviewCount > 0 && (
                <span className="text-sm text-white/35">
                  ({reviewCount} reviews)
                </span>
              )}

            </div>


            {/* PRICE */}

            <div className="flex items-end gap-4 mt-7">

              <span
                className="text-4xl font-black text-white"
                style={{
                  fontFamily:
                    "'Barlow Condensed', sans-serif",
                }}
                itemProp="price"
              >
                €{Number(
                  product.price
                ).toFixed(2)}
              </span>

              {product.originalPrice &&
                product.originalPrice >
                  product.price && (

                  <span
                    className="text-lg text-white/30 line-through mb-1"
                    style={{
                      fontFamily:
                        "'Barlow Condensed', sans-serif",
                    }}
                  >
                    €{Number(
                      product.originalPrice
                    ).toFixed(2)}
                  </span>

                )}

            </div>


            {/* STOCK */}

            <div className="mt-4">

              {isOutOfStock ? (

                <span className="text-sm text-red-400">
                  Currently out of stock
                </span>

              ) : lowStock ? (

                <span className="text-sm text-red-400">
                  Only{" "}
                  {product.stockQuantity}{" "}
                  left in stock
                </span>

              ) : (

                <span className="text-sm text-emerald-400 flex items-center gap-2">

                  <Check size={15} />

                  In stock & ready to
                  dispatch

                </span>

              )}

            </div>


            {/* DESCRIPTION */}

            {product.description && (

              <div
                className="mt-8 text-sm leading-7 text-white/55"
                itemProp="description"
              >
                {product.description}
              </div>

            )}


            {/* FLAVOURS */}

            {flavours.length > 0 && (

              <div className="mt-8">

                <p
                  className="text-xs uppercase tracking-[0.15em] text-white/50 mb-3"
                  style={{
                    fontFamily:
                      "'DM Sans', sans-serif",
                  }}
                >
                  Flavour
                </p>

                <div className="flex flex-wrap gap-2">

                  {flavours.map(
                    (flavour) => (

                      <button
                        key={flavour}
                        type="button"
                        onClick={() =>
                          setSelectedFlavour(
                            flavour
                          )
                        }
                        className="px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                        style={{
                          background:
                            selectedFlavour ===
                            flavour
                              ? accent
                              : "rgba(255,255,255,0.06)",

                          color:
                            selectedFlavour ===
                            flavour
                              ? "#000"
                              : "#fff",

                          border:
                            `1px solid ${
                              selectedFlavour ===
                              flavour
                                ? accent
                                : "rgba(255,255,255,0.1)"
                            }`,
                        }}
                      >
                        {flavour}
                      </button>

                    )
                  )}

                </div>

              </div>

            )}


            {/* QUANTITY + CART */}

            {!isOutOfStock && (

              <div className="mt-8 flex flex-col sm:flex-row gap-3">

                {/* QUANTITY */}

                <div
                  className="flex items-center justify-between rounded-full px-2 py-2 sm:w-36"
                  style={{
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                  }}
                >

                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    className="w-9 h-9 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    −
                  </button>

                  <span className="text-sm font-semibold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    className="w-9 h-9 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    +
                  </button>

                </div>


                {/* ADD */}

                <button
                  type="button"
                  onClick={
                    handleAddToCart
                  }
                  className="flex-1 rounded-full py-4 px-6 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.12em] text-black cursor-pointer transition-transform hover:scale-[1.01]"
                  style={{
                    background:
                      added
                        ? "#10B981"
                        : accent,
                  }}
                >

                  {added ? (
                    <>
                      <Check size={18} />
                      Added To Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag
                        size={18}
                      />
                      Add To Cart
                    </>
                  )}

                </button>

              </div>

            )}


            {/* BACK */}

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  product.category ||
                    "home"
                )
              }
              className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors cursor-pointer w-fit"
            >

              <ArrowLeft size={14} />

              Back to{" "}
              {category?.name ||
                "Store"}

            </button>

          </div>

        </div>


        {/* ==================================================
            CUSTOMER REVIEWS
            Sits full-width below the image/info grid. Capped at
            max-w-3xl on lg+ screens so review text stays readable on
            wide laptop/desktop viewports; expands to the full section
            width on mobile and tablet where there's less horizontal
            room to spare.
            ================================================== */}

        <div className="mt-10 sm:mt-14 lg:mt-16 max-w-3xl lg:mx-0">
          <ReviewsSection
            productId={product.id}
            accent={accent}
            onRequireAuth={onRequireAuth}
          />
        </div>

      </section>

    </main>
  );
};

export default ProductPage;