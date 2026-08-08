import React, { useEffect, useState, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp, BadgeCheck, ImagePlus, X, Loader2, SlidersHorizontal, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { reviewsService } from '../../api/reviews';
import { Review, ReviewSummary } from '../../types';

interface ReviewsSectionProps {
  productId: string | number;
  accent: string;
  onRequireAuth: () => void;
}

const PAGE_SIZE = 5;

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 11 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        fill={star <= rating ? '#D4AF37' : 'none'}
        stroke={star <= rating ? '#D4AF37' : 'white'}
        opacity={star <= rating ? 1 : 0.25}
      />
    ))}
  </div>
);

// Small deterministic avatar so review cards don't feel like bare text blocks.
const initialsOf = (name?: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId, accent, onRequireAuth }) => {
  const { isAuthenticated } = useAuth();

  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [mediaOnly, setMediaOnly] = useState(false);

  const [eligibleOrders, setEligibleOrders] = useState<{ orderId: number; deliveredAt: string }[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [helpfulVoted, setHelpfulVoted] = useState<Set<number>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const s = await reviewsService.getProductReviewSummary(productId);
      setSummary(s);
    } catch (err) {
      console.error('Failed to load review summary', err);
    }
  }, [productId]);

  const loadReviews = useCallback(async (nextOffset: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const res = await reviewsService.getProductReviews(productId, {
        sort,
        rating: ratingFilter ?? undefined,
        media: mediaOnly || undefined,
        limit: PAGE_SIZE,
        offset: nextOffset
      });
      setReviews((prev) => (append ? [...prev, ...res.reviews] : res.reviews));
      setTotal(res.total);
      setHasMore(res.hasMore);
      setOffset(nextOffset);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [productId, sort, ratingFilter, mediaOnly]);

  const loadEligibility = useCallback(async () => {
    if (!isAuthenticated) {
      setEligibleOrders([]);
      setMyReviews([]);
      return;
    }
    try {
      const res = await reviewsService.getEligibility(productId);
      setEligibleOrders(res.eligibleOrders);
      setMyReviews(res.myReviews);
    } catch (err) {
      console.error('Failed to load review eligibility', err);
    }
  }, [productId, isAuthenticated]);

  useEffect(() => {
    loadSummary();
    loadEligibility();
  }, [loadSummary, loadEligibility]);

  useEffect(() => {
    loadReviews(0, false);
  }, [loadReviews]);

  const resetForm = () => {
    setEditingReview(null);
    setSelectedOrderId(null);
    setFormRating(5);
    setFormTitle('');
    setFormText('');
    setExistingImages([]);
    setNewImageFiles([]);
  };

  const openWriteForm = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (eligibleOrders.length === 0) return;
    resetForm();
    setSelectedOrderId(eligibleOrders[0].orderId);
    setShowForm(true);
  };

  const openEditForm = (review: Review) => {
    setEditingReview(review);
    setSelectedOrderId(review.orderId);
    setFormRating(review.rating);
    setFormTitle(review.title);
    setFormText(review.review);
    setExistingImages(review.images || []);
    setNewImageFiles([]);
    setShowForm(true);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const combinedCount = existingImages.length + newImageFiles.length + files.length;
    if (combinedCount > 5) {
      toast.error('You can attach up to 5 images per review.');
      return;
    }
    setNewImageFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const removeNewImage = (idx: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formText.trim()) {
      toast.error('Please fill in a title and description for your review.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (newImageFiles.length > 0) {
        uploadedUrls = await reviewsService.uploadReviewImages(newImageFiles);
      }
      const allImages = [...existingImages, ...uploadedUrls];

      if (editingReview) {
        await reviewsService.updateReview(editingReview.id, {
          rating: formRating,
          title: formTitle.trim(),
          review: formText.trim(),
          images: allImages
        });
        toast.success('Review updated — it will need to be re-approved before it shows publicly.');
      } else {
        if (!selectedOrderId) {
          toast.error('Please select which order this review is for.');
          setSubmitting(false);
          return;
        }
        await reviewsService.addReview({
          productId,
          orderId: selectedOrderId,
          rating: formRating,
          title: formTitle.trim(),
          review: formText.trim(),
          images: allImages
        });
        toast.success('Review submitted! It will appear once approved.');
      }

      setShowForm(false);
      resetForm();
      loadEligibility();
      loadReviews(0, false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (helpfulVoted.has(reviewId)) return;
    try {
      const res = await reviewsService.markHelpful(reviewId);
      setHelpfulVoted((prev) => new Set(prev).add(reviewId));
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: res.helpfulCount ?? r.helpfulCount + 1 } : r))
      );
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already')) {
        setHelpfulVoted((prev) => new Set(prev).add(reviewId));
      }
      toast.error(err.message || 'Could not mark this review as helpful.');
    }
  };

  const breakdown = summary?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const maxBreakdown = Math.max(1, ...Object.values(breakdown));

  return (
    <div className="border-t border-white/5 pt-6 sm:pt-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
        <span
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0"
          style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
        >
          <MessageSquare size={15} style={{ color: accent }} />
        </span>
        <h3
          className="text-sm sm:text-base font-black tracking-widest uppercase text-white"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Customer Reviews <span className="text-white/40 font-bold">({summary?.total ?? total})</span>
        </h3>
      </div>

      {/* Rating Summary */}
      {summary && summary.total > 0 && (
        <div
          className="relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-6 mb-5 p-4 sm:p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* subtle accent glow, matches the site's brand treatment elsewhere */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] pointer-events-none opacity-25"
            style={{ background: accent }}
          />

          <div className="relative flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-1 sm:w-28 shrink-0 sm:border-r sm:border-white/10 sm:pr-5">
            <span
              className="text-4xl sm:text-3xl font-black text-white leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {summary.average.toFixed(1)}
            </span>
            <div className="flex flex-col items-center gap-1">
              <StarRow rating={Math.round(summary.average)} size={13} />
              <span className="text-[10px] text-white/40 whitespace-nowrap">
                {summary.total} review{summary.total === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="relative flex-1 flex flex-col gap-1.5 justify-center min-w-0">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                className="flex items-center gap-2.5 group cursor-pointer py-0.5"
              >
                <span className="text-[10px] font-semibold text-white/40 w-7 text-right group-hover:text-white/70 transition-colors">
                  {star}★
                </span>
                <div className="flex-1 h-2 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(breakdown[star as 1 | 2 | 3 | 4 | 5] / maxBreakdown) * 100}%`,
                      background: ratingFilter === star ? accent : 'rgba(255,255,255,0.25)'
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/30 w-6 text-right">{breakdown[star as 1 | 2 | 3 | 4 | 5]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
        <div className="relative">
          <SlidersHorizontal size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="pl-7 pr-2.5 py-2 sm:py-1.5 text-[11px] font-semibold text-white/80 rounded-full bg-white/[0.03] border border-white/10 outline-none cursor-pointer appearance-none hover:border-white/20 transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        <button
          onClick={() => setMediaOnly((m) => !m)}
          className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-[11px] font-semibold uppercase rounded-full border cursor-pointer transition-all"
          style={{
            borderColor: mediaOnly ? accent : 'rgba(255,255,255,0.12)',
            color: mediaOnly ? accent : 'rgba(255,255,255,0.55)',
            background: mediaOnly ? `${accent}12` : 'transparent'
          }}
        >
          <Camera size={11} />
          With Photos
        </button>

        {ratingFilter && (
          <button
            onClick={() => setRatingFilter(null)}
            className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 text-[11px] font-semibold text-white/50 hover:text-white rounded-full bg-white/[0.03] border border-white/10 cursor-pointer transition-colors"
          >
            <X size={11} /> {ratingFilter}★ filter
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-white/30 italic">
            <Loader2 size={13} className="animate-spin" /> Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-white/35 italic py-2">No approved reviews yet for this product. Be the first to write one!</p>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 sm:p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl transition-colors hover:border-white/[0.12]"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-[10px] font-black text-white/70"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {initialsOf(rev.reviewerName)}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white/85 truncate block">{rev.reviewerName}</span>
                    {rev.isVerifiedPurchase && (
                      <span
                        className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ color: accent }}
                      >
                        <BadgeCheck size={10} /> Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <StarRow rating={rev.rating} />
              </div>

              <p className="text-[13px] sm:text-xs font-bold text-white/75 mb-0.5">{rev.title}</p>
              <p className="text-[13px] sm:text-xs text-white/55 leading-relaxed font-light mb-2.5">{rev.review}</p>

              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2 mb-2.5 flex-wrap">
                  {rev.images.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-white/10" />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/25">
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                </span>
                <button
                  onClick={() => handleMarkHelpful(rev.id)}
                  disabled={helpfulVoted.has(rev.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 -mr-1.5 rounded-full text-[10px] font-semibold text-white/45 hover:text-white hover:bg-white/5 disabled:opacity-60 cursor-pointer disabled:cursor-default transition-colors"
                >
                  <ThumbsUp size={11} fill={helpfulVoted.has(rev.id) ? 'currentColor' : 'none'} />
                  Helpful ({rev.helpfulCount})
                </button>
              </div>

              {rev.adminReply && (
                <div
                  className="mt-3 pl-3 py-2 pr-3 rounded-r-lg border-l-2"
                  style={{ borderColor: accent, background: `${accent}0a` }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5" style={{ color: accent }}>
                    Response from CeltiCore
                  </p>
                  <p className="text-xs text-white/60 font-light">{rev.adminReply}</p>
                </div>
              )}
            </div>
          ))
        )}

        {hasMore && (
          <button
            onClick={() => loadReviews(offset + PAGE_SIZE, true)}
            disabled={loadingMore}
            className="self-center px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {loadingMore && <Loader2 size={11} className="animate-spin" />}
            Load More
          </button>
        )}
      </div>

      {/* My existing reviews (any status) */}
      {isAuthenticated && myReviews.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/40">Your Review{myReviews.length > 1 ? 's' : ''}</p>
          {myReviews.map((rev) => (
            <div key={rev.id} className="p-3 border border-white/10 bg-white/[0.02] rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <StarRow rating={rev.rating} size={11} />
                <span
                  className="text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded-full"
                  style={{
                    color: rev.status === 'approved' ? '#34d399' : rev.status === 'rejected' ? '#f87171' : '#fbbf24',
                    background:
                      rev.status === 'approved' ? 'rgba(52,211,153,0.1)' : rev.status === 'rejected' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)'
                  }}
                >
                  {rev.status}
                </span>
              </div>
              <button
                onClick={() => openEditForm(rev)}
                className="text-[10px] font-bold uppercase tracking-wide cursor-pointer px-2 py-1 rounded-full hover:bg-white/5 transition-colors"
                style={{ color: accent }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Write a Review trigger */}
      {!showForm && (
        <div className="border-t border-white/5 pt-4 sm:pt-5">
          {!isAuthenticated ? (
            <button
              onClick={onRequireAuth}
              className="w-full py-3 sm:py-2.5 text-[11px] font-bold tracking-widest uppercase rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/25 transition-all cursor-pointer"
            >
              Log In to Write a Review
            </button>
          ) : eligibleOrders.length > 0 ? (
            <button
              onClick={openWriteForm}
              className="w-full py-3 sm:py-2.5 text-[11px] font-bold tracking-widest uppercase rounded-full transition-all duration-200 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
                color: '#000',
                boxShadow: `0 0 20px ${accent}35`
              }}
            >
              Write a Review
            </button>
          ) : (
            <p className="text-[11px] text-white/30 italic text-center px-2">
              You can write a review once you've purchased this product and it's been delivered.
            </p>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-white/5 pt-4 sm:pt-5 flex flex-col gap-3.5 sm:gap-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-white/80">
              {editingReview ? 'Edit Your Review' : 'Write a Review'}
            </h4>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {!editingReview && eligibleOrders.length > 1 && (
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Which order is this for?</label>
              <select
                value={selectedOrderId ?? ''}
                onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs text-white rounded-xl border border-white/10 bg-white/[0.03] outline-none focus:border-emerald-500/60 transition-colors"
              >
                {eligibleOrders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    Order #{o.orderId} — {new Date(o.deliveredAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Overall Rating</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormRating(star)}
                  className="cursor-pointer p-1 -m-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star size={24} fill={star <= formRating ? '#D4AF37' : 'none'} stroke={star <= formRating ? '#D4AF37' : 'white'} opacity={star <= formRating ? 1 : 0.25} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Review Title</label>
            <input
              type="text"
              required
              maxLength={150}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Sum up your experience"
              className="w-full px-3.5 py-2.5 text-sm sm:text-xs text-white rounded-xl border border-white/10 focus:border-emerald-500/60 bg-white/[0.03] outline-none transition-colors placeholder-white/25"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Review Description</label>
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="w-full px-3.5 py-2.5 text-sm sm:text-xs text-white rounded-xl border border-white/10 focus:border-emerald-500/60 bg-white/[0.03] outline-none transition-colors placeholder-white/25 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Photos (optional, up to 5)</label>
            <div className="flex flex-wrap gap-2.5">
              {existingImages.map((url) => (
                <div key={url} className="relative w-16 h-16">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-white/10" />
                  <button type="button" onClick={() => removeExistingImage(url)} className="absolute -top-1.5 -right-1.5 bg-black rounded-full p-1 border border-white/20 cursor-pointer hover:border-white/40">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {newImageFiles.map((file, i) => (
                <div key={i} className="relative w-16 h-16">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-xl border border-white/10" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute -top-1.5 -right-1.5 bg-black rounded-full p-1 border border-white/20 cursor-pointer hover:border-white/40">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {existingImages.length + newImageFiles.length < 5 && (
                <label className="w-16 h-16 flex flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-white/20 text-white/30 hover:text-white/60 hover:border-white/40 cursor-pointer transition-colors">
                  <ImagePlus size={17} />
                  <span className="text-[8px] font-semibold uppercase tracking-wide">Add</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImagePick} />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="py-3 sm:py-2.5 text-[11px] font-bold tracking-widest uppercase rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
              color: '#000',
              boxShadow: `0 0 20px ${accent}35`
            }}
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {submitting ? 'Submitting...' : editingReview ? 'Save Changes' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
};