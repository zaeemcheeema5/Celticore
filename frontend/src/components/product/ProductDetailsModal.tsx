import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, Plus, Minus, Heart, Check } from 'lucide-react';
import { Product, Review } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { reviewsService } from '../../api/reviews';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  accent: string;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  accent,
}) => {
  if (!isOpen || !product) return null;
const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavour, setSelectedFlavour] = useState(product.flavours[0] || 'Unflavoured');
  const [added, setAdded] = useState(false);

  // Review Form state
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load reviews on mount/product change
  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const list = await reviewsService.getProductReviews(product.id);
        setReviews(list);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
    setQuantity(1);
    setSelectedFlavour(product.flavours[0] || 'Unflavoured');
  }, [product]);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedFlavour);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewText.trim()) {
      toast.error("Please fill in both name and review content.");
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewsService.addReview({
    product_id: product.id,
    user_id: user.id,
    rating: reviewRating,
    comment: reviewText,
});
      toast.success("Review submitted! It will appear once approved by an moderator.");
      setReviewerName('');
      setReviewText('');
      setReviewRating(5);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl sm:rounded border border-white/10 bg-[#080808] text-white overflow-hidden shadow-2xl flex flex-col md:flex-row my-0 sm:my-8 min-h-screen sm:min-h-0"
        style={{
          maxHeight: '90vh',
          boxShadow: `0 0 50px ${accent}0d`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 text-white hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-all z-20 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Product Visual Column */}
        <div className="w-full md:w-1/2 relative bg-[#111] flex items-center justify-center min-h-[240px] sm:min-h-[300px] md:min-h-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover max-h-[450px] md:max-h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80 md:hidden" />
        </div>

        {/* Product Details & Reviews Column */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col overflow-y-auto max-h-[calc(100vh-240px)] sm:max-h-[calc(90vh-2px)] md:max-h-[calc(90vh-2px)]">
          {/* Header */}
          <div className="mb-4">
            <span
              className="px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 mr-2"
            >
              {product.category || 'Supplement'}
            </span>
            {product.badge && (
              <span
                className="px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase text-black"
                style={{ background: accent }}
              >
                {product.badge}
              </span>
            )}
            
            <h2
              className="text-xl sm:text-2.5xl font-black uppercase tracking-tight text-white leading-tight mt-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {product.name}
            </h2>
            <p className="text-xs text-white/50" style={{ color: accent }}>{product.subtitle}</p>
          </div>

          {/* Description */}
          <p className="text-xs text-white/60 leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {product.description}
          </p>

          {/* Configurations */}
          <div className="mb-6 flex flex-col gap-4 border-t border-b border-white/5 py-4">
            {/* Flavour Selector */}
            {product.flavours && product.flavours.length > 0 && (
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">Select Flavour</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.flavours.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFlavour(f)}
                      className="px-3 py-1 text-xs font-semibold uppercase transition-all duration-200 border cursor-pointer"
                      style={{
                        borderColor: selectedFlavour === f ? accent : "rgba(255,255,255,0.12)",
                        color: selectedFlavour === f ? accent : "rgba(255,255,255,0.45)",
                        background: selectedFlavour === f ? `${accent}12` : "transparent",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30">Quantity</p>
                {product.stockQuantity === 0 ? (
                  <span className="text-xs text-red-500 font-bold mt-1.5 block">Unavailable</span>
                ) : (
                  <div className="flex items-center gap-3 mt-1.5 border border-white/10 bg-black/40 px-2 py-1">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-white/40 hover:text-white p-1 cursor-pointer"><Minus size={12} /></button>
                    <span className="text-xs font-bold w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(product.stockQuantity ?? 999, q + 1))} className="text-white/40 hover:text-white p-1 cursor-pointer"><Plus size={12} /></button>
                  </div>
                )}
              </div>

              {/* Price Display */}
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30">Price</p>
                <div className="mt-1 flex items-baseline justify-end">
                  <span className="text-2xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    €{(product.price * quantity).toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-white/30 line-through ml-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      €{(parseFloat(product.originalPrice.toString()) * quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Banner */}
          {product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold ?? 10) && (
            <div className="text-[10px] text-red-400 font-bold mb-4 uppercase tracking-widest animate-pulse">
              ⚠️ Low Stock Warning: Only {product.stockQuantity} left in our inventory!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            {product.stockQuantity === 0 ? (
              <button
                disabled
                className="flex-1 py-3 text-xs font-black tracking-widest uppercase transition-all duration-250 opacity-40 bg-white/5 border border-white/10 text-white cursor-not-allowed flex items-center justify-center"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Out Of Stock
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 text-xs font-black tracking-widest uppercase transition-all duration-250 cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: added ? "#10B981" : accent, color: "#000", fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {added ? <><Check size={14} /> Added to Cart</> : <><Plus size={14} /> Add to Cart</>}
              </button>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className="p-3 border border-white/15 hover:border-white/40 bg-transparent text-white/60 hover:text-white transition-all cursor-pointer"
              title="Add to Wishlist"
            >
              <Heart size={16} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          {/* Reviews List & Write Review Tab */}
          <div className="border-t border-white/5 pt-6">
            <h3 className="text-sm font-black tracking-widest uppercase text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              <MessageSquare size={14} style={{ color: accent }} />
              Customer Reviews ({reviews.length})
            </h3>

            {/* List */}
            <div className="flex flex-col gap-4 mb-6 max-h-[220px] overflow-y-auto pr-1">
              {loadingReviews ? (
                <p className="text-xs text-white/30 italic">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-white/35 italic">No approved reviews yet for this product. Be the first to write one!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-white/5 border border-white/5 rounded-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-white/80">{rev.user_name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={9} fill={star <= rev.rating ? "#D4AF37" : "none"} stroke={star <= rev.rating ? "#D4AF37" : "white"} opacity={star <= rev.rating ? 1 : 0.2} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-light">{rev.review}</p>
                  </div>
                ))
              )}
            </div>

            {/* Submit Form */}
            <form onSubmit={handleSubmitReview} className="border-t border-white/5 pt-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/70">Write a Review</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs text-white border border-white/10 focus:border-emerald-500/60 bg-black outline-none"
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Terrible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase text-white/40 mb-1">Review</label>
                <textarea
                  required
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full px-3 py-2 text-xs text-white border border-white/10 focus:border-emerald-500/60 bg-black outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-50"
                style={{
                  border: `1px solid ${accent}`,
                  color: accent,
                  background: `${accent}0c`,
                }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};