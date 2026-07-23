import React, { useEffect, useState, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp, BadgeCheck, ImagePlus, X, Loader2 } from 'lucide-react';
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
    <div className="border-t border-white/5 pt-6">
      <h3
        className="text-sm font-black tracking-widest uppercase text-white mb-4 flex items-center gap-2"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        <MessageSquare size={14} style={{ color: accent }} />
        Customer Reviews ({summary?.total ?? total})
      </h3>

      {/* Rating Summary */}
      {summary && summary.total > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-5 p-3 bg-white/[0.03] border border-white/5 rounded-sm">
          <div className="flex flex-col items-center justify-center sm:w-24 shrink-0">
            <span className="text-2xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {summary.average.toFixed(1)}
            </span>
            <StarRow rating={Math.round(summary.average)} size={12} />
            <span className="text-[9px] text-white/40 mt-1">{summary.total} review{summary.total === 1 ? '' : 's'}</span>
          </div>
          <div className="flex-1 flex flex-col gap-1 justify-center">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <span className="text-[9px] text-white/40 w-6 text-right group-hover:text-white/70">{star}★</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(breakdown[star as 1 | 2 | 3 | 4 | 5] / maxBreakdown) * 100}%`,
                      background: ratingFilter === star ? accent : 'rgba(255,255,255,0.25)'
                    }}
                  />
                </div>
                <span className="text-[9px] text-white/30 w-6">{breakdown[star as 1 | 2 | 3 | 4 | 5]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="px-2 py-1 text-[10px] text-white border border-white/10 bg-black outline-none cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
          <option value="helpful">Most Helpful</option>
        </select>

        <button
          onClick={() => setMediaOnly((m) => !m)}
          className="px-2 py-1 text-[10px] font-semibold uppercase border cursor-pointer transition-all"
          style={{
            borderColor: mediaOnly ? accent : 'rgba(255,255,255,0.12)',
            color: mediaOnly ? accent : 'rgba(255,255,255,0.5)',
            background: mediaOnly ? `${accent}12` : 'transparent'
          }}
        >
          With Photos
        </button>

        {ratingFilter && (
          <button
            onClick={() => setRatingFilter(null)}
            className="px-2 py-1 text-[10px] text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <X size={10} /> {ratingFilter}★ filter
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-4 mb-6">
        {loading ? (
          <p className="text-xs text-white/30 italic">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-white/35 italic">No approved reviews yet for this product. Be the first to write one!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-3 bg-white/5 border border-white/5 rounded-sm">
              <div className="flex justify-between items-start mb-1 gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white/80">{rev.reviewerName}</span>
                  {rev.isVerifiedPurchase && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide rounded-sm"
                      style={{ color: accent, background: `${accent}15` }}
                    >
                      <BadgeCheck size={9} /> Verified Purchase
                    </span>
                  )}
                </div>
                <StarRow rating={rev.rating} />
              </div>
              <p className="text-xs font-bold text-white/70 mb-0.5">{rev.title}</p>
              <p className="text-xs text-white/60 leading-relaxed font-light mb-2">{rev.review}</p>

              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {rev.images.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded-sm border border-white/10" />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/25">
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                </span>
                <button
                  onClick={() => handleMarkHelpful(rev.id)}
                  disabled={helpfulVoted.has(rev.id)}
                  className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white disabled:opacity-60 cursor-pointer disabled:cursor-default"
                >
                  <ThumbsUp size={10} fill={helpfulVoted.has(rev.id) ? 'currentColor' : 'none'} />
                  Helpful ({rev.helpfulCount})
                </button>
              </div>

              {rev.adminReply && (
                <div className="mt-2 pl-3 border-l-2" style={{ borderColor: accent }}>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-white/40 mb-0.5">Response from CeltiCore</p>
                  <p className="text-xs text-white/55 font-light">{rev.adminReply}</p>
                </div>
              )}
            </div>
          ))
        )}

        {hasMore && (
          <button
            onClick={() => loadReviews(offset + PAGE_SIZE, true)}
            disabled={loadingMore}
            className="self-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
            <div key={rev.id} className="p-2.5 border border-white/10 bg-white/[0.02] rounded-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StarRow rating={rev.rating} size={10} />
                <span className="text-[9px] uppercase font-bold tracking-wide"
                  style={{
                    color: rev.status === 'approved' ? '#34d399' : rev.status === 'rejected' ? '#f87171' : '#fbbf24'
                  }}
                >
                  {rev.status}
                </span>
              </div>
              <button
                onClick={() => openEditForm(rev)}
                className="text-[10px] font-bold uppercase tracking-wide cursor-pointer"
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
        <div className="border-t border-white/5 pt-4">
          {!isAuthenticated ? (
            <button
              onClick={onRequireAuth}
              className="w-full py-2.5 text-[10px] font-bold tracking-widest uppercase border border-white/15 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              Log In to Write a Review
            </button>
          ) : eligibleOrders.length > 0 ? (
            <button
              onClick={openWriteForm}
              className="w-full py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer"
              style={{ border: `1px solid ${accent}`, color: accent, background: `${accent}0c` }}
            >
              Write a Review
            </button>
          ) : (
            <p className="text-[10px] text-white/30 italic text-center">
              You can write a review once you've purchased this product and it's been delivered.
            </p>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-t border-white/5 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold tracking-widest uppercase text-white/70">
              {editingReview ? 'Edit Your Review' : 'Write a Review'}
            </h4>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-white/40 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {!editingReview && eligibleOrders.length > 1 && (
            <div>
              <label className="block text-[9px] uppercase text-white/40 mb-1">Which order is this for?</label>
              <select
                value={selectedOrderId ?? ''}
                onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs text-white border border-white/10 bg-black outline-none"
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
            <label className="block text-[9px] uppercase text-white/40 mb-1">Overall Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setFormRating(star)} className="cursor-pointer">
                  <Star size={18} fill={star <= formRating ? '#D4AF37' : 'none'} stroke={star <= formRating ? '#D4AF37' : 'white'} opacity={star <= formRating ? 1 : 0.25} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase text-white/40 mb-1">Review Title</label>
            <input
              type="text"
              required
              maxLength={150}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Sum up your experience"
              className="w-full px-3 py-2 text-xs text-white border border-white/10 focus:border-emerald-500/60 bg-black outline-none"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase text-white/40 mb-1">Review Description</label>
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="w-full px-3 py-2 text-xs text-white border border-white/10 focus:border-emerald-500/60 bg-black outline-none"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase text-white/40 mb-1">Photos (optional, up to 5)</label>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((url) => (
                <div key={url} className="relative w-14 h-14">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-sm border border-white/10" />
                  <button type="button" onClick={() => removeExistingImage(url)} className="absolute -top-1.5 -right-1.5 bg-black rounded-full p-0.5 border border-white/20 cursor-pointer">
                    <X size={9} />
                  </button>
                </div>
              ))}
              {newImageFiles.map((file, i) => (
                <div key={i} className="relative w-14 h-14">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-sm border border-white/10" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute -top-1.5 -right-1.5 bg-black rounded-full p-0.5 border border-white/20 cursor-pointer">
                    <X size={9} />
                  </button>
                </div>
              ))}
              {existingImages.length + newImageFiles.length < 5 && (
                <label className="w-14 h-14 flex items-center justify-center border border-dashed border-white/20 text-white/30 hover:text-white/60 hover:border-white/40 cursor-pointer rounded-sm">
                  <ImagePlus size={16} />
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImagePick} />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ border: `1px solid ${accent}`, color: accent, background: `${accent}0c` }}
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {submitting ? 'Submitting...' : editingReview ? 'Save Changes' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
};