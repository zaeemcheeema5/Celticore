import React, { useEffect, useState } from 'react';
import { ArrowLeft, Package, Star, Loader2, CreditCard, Search, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { ordersService } from '../api/orders';
import { reviewsService } from '../api/reviews';
import { Order, OrderItem } from '../types';

interface MyOrdersProps {
  onNavigate: (page: string) => void;
  // 'mine'  -> the logged-in customer's full order history (GET /api/orders/mine)
  // 'track' -> guest order lookup by Order ID + email (POST /api/orders/track),
  //            no login required. Defaults to 'mine' so existing callers
  //            (e.g. Footer's old link) keep working unchanged.
  mode?: 'mine' | 'track';
  // Opens the sign-in modal. Optional so this component doesn't break if a
  // caller doesn't wire it up — the "Sign In" button just won't render.
  onOpenAuth?: () => void;
}

const ACCENT = '#10B981';

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  cancelled: 'bg-red-500/10 text-red-400 border border-red-500/25',
};

function statusStyle(status: string) {
  return STATUS_STYLES[status?.toLowerCase()] || 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: 'text-emerald-400',
  failed: 'text-red-400',
  pending: 'text-amber-400',
  unpaid: 'text-amber-400',
};

function paymentStatusStyle(status?: string) {
  return PAYMENT_STATUS_STYLES[(status || '').toLowerCase()] || 'text-white/40';
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Card',
  gpay: 'Google Pay',
  applepay: 'Apple Pay',
};

function paymentMethodLabel(method?: string) {
  if (!method) return 'N/A';
  return PAYMENT_METHOD_LABELS[method.toLowerCase()] || method;
}

interface ReviewFormState {
  orderId: number;
  productId: string | number;
  productName: string;
  reviewId?: number;
  rating: number;
  title: string;
  review: string;
}

// Shared order card — used both for the authenticated "My Orders" list and
// for the single result of a guest order-tracking lookup. Review actions
// only render when `onReview` is passed (the guest tracking flow has no
// concept of "your account's reviews", so it's simply omitted there).
function OrderCard({
  order,
  onReview,
}: {
  order: Order;
  onReview?: (order: Order, item: OrderItem) => void;
}) {
  return (
    <div className="p-4 bg-white/[0.03] border border-white/8 rounded-xl space-y-4 text-xs">
      <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-white/5">
        <div>
          <span className="font-bold text-white">Order #{order.id}</span>
          <span className="text-white/40 ml-2">({new Date(order.createdAt).toLocaleDateString()})</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${statusStyle(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-white/40">
        <CreditCard size={12} />
        <span>{paymentMethodLabel(order.paymentMethod)}</span>
        <span className="text-white/20">•</span>
        <span className={`font-bold uppercase ${paymentStatusStyle(order.paymentStatus)}`}>
          {order.paymentStatus || 'unknown'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
            <div>
              <p className="text-white/80 font-semibold">{item.name}</p>
              <p className="text-white/35">
                Qty {item.quantity} {item.flavour ? `• ${item.flavour}` : ''} • €{item.price.toFixed(2)}
              </p>
            </div>
            {onReview && order.canReview && (
              item.review ? (
                <button
                  onClick={() => onReview(order, item)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border border-white/15 text-white/60 hover:text-white cursor-pointer"
                >
                  <Star size={11} /> Edit Review ({item.review.status})
                </button>
              ) : (
                <button
                  onClick={() => onReview(order, item)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide cursor-pointer"
                  style={{ border: `1px solid ${ACCENT}`, color: ACCENT, background: `${ACCENT}0c` }}
                >
                  <Star size={11} /> Write a Review
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {(order.address || order.city) && (
        <div className="pt-2 border-t border-white/5 text-[10px] text-white/40">
          Shipping to: {[order.address, order.city, order.postalCode, order.country].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}

export const MyOrders: React.FC<MyOrdersProps> = ({ onNavigate, mode = 'mine', onOpenAuth }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // ── "My Orders" (authenticated) state ──────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<ReviewFormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Guest order-tracking state ──────────────────────────────────────
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== 'mine') return;
    if (isAuthenticated) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, mode]);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim() || !trackEmail.trim()) {
      setTrackError('Enter both your Order ID and the email used at checkout.');
      return;
    }

    setTrackLoading(true);
    setTrackError(null);
    setTrackedOrder(null);

    try {
      const order = await ordersService.trackOrder(trackOrderId.trim(), trackEmail.trim());
      setTrackedOrder(order);
    } catch (err: any) {
      setTrackError(err.message || "We couldn't find an order matching that Order ID and email.");
    } finally {
      setTrackLoading(false);
    }
  };

  const openReviewForm = (order: Order, item: OrderItem) => {
    if (item.review) {
      setFormState({
        orderId: order.id,
        productId: item.product_id,
        productName: item.name,
        reviewId: item.review.id,
        rating: item.review.rating,
        title: item.review.title,
        review: item.review.review
      });
    } else {
      setFormState({
        orderId: order.id,
        productId: item.product_id,
        productName: item.name,
        rating: 5,
        title: '',
        review: ''
      });
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState) return;

    if (!formState.title.trim() || !formState.review.trim()) {
      toast.error('Please fill in a title and description.');
      return;
    }

    setSubmitting(true);
    try {
      if (formState.reviewId) {
        await reviewsService.updateReview(formState.reviewId, {
          rating: formState.rating,
          title: formState.title.trim(),
          review: formState.review.trim()
        });
        toast.success('Review updated — pending re-approval.');
      } else {
        await reviewsService.addReview({
          productId: formState.productId,
          orderId: formState.orderId,
          rating: formState.rating,
          title: formState.title.trim(),
          review: formState.review.trim()
        });
        toast.success('Review submitted! It will appear once approved.');
      }
      setFormState(null);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────
  // GUEST ORDER TRACKING — /track-order, no login required
  // ────────────────────────────────────────────────────────────────────
  if (mode === 'track') {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-14 text-white">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Store
        </button>

        <h1
          className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Track Your Order
        </h1>
        <p className="text-xs text-white/40 mb-8">
          No account needed — enter your Order ID and the email you used at checkout.
        </p>

        <form onSubmit={handleTrackOrder} noValidate className="space-y-3 mb-8">
          <div>
            <label htmlFor="track-order-id" className="block text-[9px] uppercase text-white/50 mb-1">Order ID *</label>
            <input
              id="track-order-id"
              type="text"
              required
              placeholder="e.g. 1042"
              value={trackOrderId}
              onChange={(e) => setTrackOrderId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-white bg-black border border-white/10 focus:border-emerald-500 outline-none rounded-sm"
            />
          </div>

          <div>
            <label htmlFor="track-email" className="block text-[9px] uppercase text-white/50 mb-1">Email used at checkout *</label>
            <input
              id="track-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={trackEmail}
              onChange={(e) => setTrackEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-white bg-black border border-white/10 focus:border-emerald-500 outline-none rounded-sm"
            />
          </div>

          {trackError && (
            <p className="text-[11px] text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} /> {trackError}
            </p>
          )}

          <button
            type="submit"
            disabled={trackLoading}
            className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer rounded-sm transition-colors"
          >
            {trackLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Looking Up Order...</>
            ) : (
              <><Search size={14} /> Track Order</>
            )}
          </button>
        </form>

        {trackedOrder && <OrderCard order={trackedOrder} />}

        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="mt-8 flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white cursor-pointer"
          >
            <LogIn size={12} /> Have an account? Sign in to see your full order history
          </button>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // MY ORDERS — /my-orders, requires an account
  // ────────────────────────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Package size={32} className="text-white/15" />
        <p className="text-sm text-white/50">Log in to view your order history.</p>
        <div className="flex items-center gap-3">
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-black cursor-pointer rounded-sm"
              style={{ background: ACCENT }}
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => onNavigate('track-order')}
            className="text-[11px] text-white/40 hover:text-white uppercase tracking-[0.15em] transition-colors cursor-pointer"
          >
            Track an order without signing in →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-white">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white mb-6 cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Store
      </button>

      <h1
        className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-8"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        My Orders
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/30 gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2.5">
          <Package size={28} className="text-white/15" />
          <p className="text-xs text-white/30 italic">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onReview={openReviewForm} />
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {formState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setFormState(null); }}
        >
          <form
            onSubmit={submitReview}
            className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-xl p-6 flex flex-col gap-3"
          >
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              {formState.reviewId ? 'Edit Review' : 'Write a Review'} — {formState.productName}
            </h3>

            <div>
              <label className="block text-[9px] uppercase text-white/40 mb-1">Overall Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormState((f) => (f ? { ...f, rating: star } : f))}
                    className="cursor-pointer"
                  >
                    <Star
                      size={18}
                      fill={star <= formState.rating ? '#D4AF37' : 'none'}
                      stroke={star <= formState.rating ? '#D4AF37' : 'white'}
                      opacity={star <= formState.rating ? 1 : 0.25}
                    />
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
                value={formState.title}
                onChange={(e) => setFormState((f) => (f ? { ...f, title: e.target.value } : f))}
                className="w-full px-3 py-2 text-xs text-white border border-white/10 bg-black outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase text-white/40 mb-1">Review Description</label>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={formState.review}
                onChange={(e) => setFormState((f) => (f ? { ...f, review: e.target.value } : f))}
                className="w-full px-3 py-2 text-xs text-white border border-white/10 bg-black outline-none"
              />
            </div>

            <p className="text-[9px] text-white/30 italic">
              Photos can be added from the product page's review section.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFormState(null)}
                className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border border-white/15 text-white/60 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer disabled:opacity-50"
                style={{ border: `1px solid ${ACCENT}`, color: ACCENT, background: `${ACCENT}0c` }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};