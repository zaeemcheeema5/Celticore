import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock, ArrowRight, ArrowLeft, CheckCircle2, ShoppingBag, ShieldCheck,
  AlertCircle, Loader2, Globe2, BadgeCheck, Truck, ChevronDown, Zap, MapPin
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/client';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { toast } from 'sonner';
import { deliveryService, DeliveryQuote } from '../../api/delivery';
import {
  IRISH_COUNTIES, validateEircode, validatePhone, formatEircode, estimateLabel, euro
} from '../../utils/delivery';
// @ts-ignore
import confetti from 'canvas-confetti';

// Load Stripe if a key is provided
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface CheckoutPageProps {
  // Standard app-level navigation, same signature as everywhere else in
  // App.tsx (Navbar, Footer, etc.) so this page slots into the existing
  // router pattern instead of being a one-off modal.
  onNavigate: (page: string) => void;
}

interface ShippingErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  delivery?: string;
}

// We only deliver within the Republic of Ireland.
const DELIVERY_COUNTRY = 'Ireland';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cartItems, subtotal, discount, coupon, placeOrder } = useCart();

  // Checkout flow step: 'form' | 'success'
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [intentUpdating, setIntentUpdating] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [intentVersion, setIntentVersion] = useState(0);
  const [retryTick, setRetryTick] = useState(0);

  // Delivery options + totals, calculated by the SERVER (never from browser prices)
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteTick, setQuoteTick] = useState(0);

  // Mobile order-summary accordion (see JSX below) — collapsed by default
  // so the form isn't pushed too far down, but the totals are always
  // visible as a compact sticky bar above it.
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Form shipping/billing inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<ShippingErrors>({});

  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'form') firstFieldRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [step]);

  // ── 1) Delivery quote ────────────────────────────────────────────────
  // Asks the server for the product subtotal, coupon discount and the price of
  // every available delivery method (free delivery already applied when the
  // order qualifies). Re-runs when the cart or coupon changes.
  useEffect(() => {
    if (cartItems.length === 0) return;
    let cancelled = false;

    setQuoteLoading(true);
    setQuoteError(null);

    deliveryService
      .getQuote(
        cartItems.map(item => ({ id: item.product.id, quantity: item.quantity })),
        coupon?.code
      )
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error(err);
        setQuote(null);
        setQuoteError(err?.message || "We couldn't load delivery options. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => { cancelled = true; };
  }, [cartItems, coupon, quoteTick]);

  // The delivery option applied to the order (chosen by the business, not the shopper).
  const selectedMethod = quote?.delivery || null;

  // What the order summary shows. Server numbers win once we have them.
  const shownSubtotal = quote ? quote.subtotal : subtotal;
  const shownDiscount = quote ? quote.discount : discount;
  // Final Total = Product Subtotal - Discount + Delivery Fee
  const grandTotal: number | null = quote ? quote.total : null;

  // ── 2) Stripe PaymentIntent ──────────────────────────────────────────
  // ONE PaymentIntent per checkout. When the delivery method, cart or coupon
  // changes we ask the server to UPDATE that same intent to the newly
  // calculated amount instead of creating another one. Requests are chained
  // through a queue, so two quick changes can never create two intents.
  const intentIdRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const latestRequestRef = useRef(0);

  const syncIntent = useCallback((): Promise<any> => {
    const job = queueRef.current.then(async () => {
      const response = await api.post("/api/payment/create-intent", {
        items: cartItems.map(item => ({
          id: item.product.id,
          quantity: item.quantity
        })),
        couponCode: coupon?.code,
        paymentIntentId: intentIdRef.current || undefined
      });
      intentIdRef.current = response.paymentIntentId || intentIdRef.current;
      return response;
    });
    queueRef.current = job.catch(() => undefined);
    return job;
  }, [cartItems, coupon]);

  useEffect(() => {
    if (!stripeKey || cartItems.length === 0 || !quote) return;

    let cancelled = false;
    const requestId = ++latestRequestRef.current;

    setIntentUpdating(true);
    setIntentError(null);

    syncIntent()
      .then((response) => {
        if (cancelled || requestId !== latestRequestRef.current) return;
        setClientSecret(prev => (prev === response.clientSecret ? prev : response.clientSecret));
        setIntentVersion(v => v + 1);
      })
      .catch((err: any) => {
        console.error(err);
        if (cancelled || requestId !== latestRequestRef.current) return;
        setIntentError(err?.message && /delivery|cart|item|product/i.test(err.message)
          ? err.message
          : "We couldn't set up secure payment. Please try again.");
      })
      .finally(() => {
        if (!cancelled && requestId === latestRequestRef.current) setIntentUpdating(false);
      });

    return () => { cancelled = true; };
  }, [syncIntent, quote, retryTick]);

  const retryIntent = () => {
    setIntentError(null);
    setRetryTick(t => t + 1);
  };

  // Last check right before the card is charged: make sure the PaymentIntent
  // matches what the shopper is looking at. If the server's numbers moved
  // (price, coupon or delivery fee changed), we stop and show the new total
  // instead of charging an amount they haven't seen.
  const ensureIntentCurrent = async (expectedTotal: number | null): Promise<boolean> => {
    try {
      const response = await syncIntent();
      const sameIntent = response.clientSecret === clientSecret;
      const sameTotal = expectedTotal !== null && Math.abs(response.total - expectedTotal) < 0.005;

      if (!sameIntent || !sameTotal) {
        setClientSecret(response.clientSecret);
        setIntentVersion(v => v + 1);
        setQuoteTick(t => t + 1);
        toast.error('Your order total was updated. Please review it and press pay again.');
        return false;
      }
      return true;
    } catch (err: any) {
      toast.error(err?.message || "We couldn't confirm your order total. Please try again.");
      return false;
    }
  };

  // Field-level validation, run on blur and on submit so errors show inline
  const validateField = (field: keyof ShippingErrors, value: string): string | undefined => {
    if (field === 'email') {
      if (!value.trim()) return 'Email is required.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Enter a valid email address.';
      return undefined;
    }
    if (field === 'phone') return validatePhone(value);
    if (field === 'postalCode') return validateEircode(value);
    if (field === 'county') return value ? undefined : 'Select your county.';
    const labels: Record<string, string> = {
      name: 'Full name', address: 'Address line 1', city: 'Town / city'
    };
    if (!value.trim()) return `${labels[field]} is required.`;
    return undefined;
  };

  const handleBlur = (field: keyof ShippingErrors, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const validateShippingDetails = (): boolean => {
    const fields: [keyof ShippingErrors, string][] = [
      ['name', name], ['email', email], ['phone', phone], ['address', address],
      ['city', city], ['county', county], ['postalCode', postalCode]
    ];
    const nextErrors: ShippingErrors = {};
    fields.forEach(([field, value]) => {
      const err = validateField(field, value);
      if (err) nextErrors[field] = err;
    });
    if (!selectedMethod) nextErrors.delivery = 'Delivery details are still loading.';
    setErrors(nextErrors);
    setTouched({
      name: true, email: true, phone: true, address: true, city: true,
      county: true, postalCode: true, delivery: true
    });

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields before continuing.');
      return false;
    }
    return true;
  };

  const handleOrderSubmission = async (paymentIntentId: string) => {
    setLoading(true);
    try {
      const order = await placeOrder({
        customerName: name,
        customerEmail: email,
        phone: phone,
        address: address,
        address2: address2,
        city: city,
        county: county,
        postalCode: formatEircode(postalCode),
        country: DELIVERY_COUNTRY,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntentId
      });
      setPlacedOrder(order);
      setStep('success');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#ffffff', '#34d399']
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const fieldClass = (field: keyof ShippingErrors) =>
    `w-full px-3 py-2.5 bg-black border outline-none text-white transition-colors rounded-sm ${
      touched[field] && errors[field]
        ? 'border-red-500/70 focus:border-red-500'
        : 'border-white/10 focus:border-emerald-500/60'
    }`;

  // Empty-cart guard — same message either way, just page-shaped now.
  if (cartItems.length === 0 && step === 'form') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <ShoppingBag size={32} className="mx-auto text-white/30" />
          <p className="text-sm text-white/60">Your cart is empty — add something before checking out.</p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs cursor-pointer rounded-sm"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const OrderSummaryBody = (
    <>
      <div className="space-y-3 divide-y divide-white/5 max-h-[40vh] overflow-y-auto pr-1">
        {cartItems.map((item) => (
          <div key={`${item.product.id}-${item.flavour}`} className="flex gap-3 text-xs pt-3 first:pt-0">
            <img src={item.product.image} alt={item.product.name} className="w-11 h-11 object-cover bg-black border border-white/5 rounded-sm shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{item.product.name}</p>
              <p className="text-[10px] text-emerald-400 font-semibold">{item.flavour}</p>
              <p className="text-[10px] text-white/40 mt-0.5">Qty: {item.quantity} · €{item.product.price.toFixed(2)}</p>
            </div>
            <span className="font-bold text-white pl-2">€{(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 pt-4 mt-4 space-y-2 text-xs text-white/50">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-white">€{shownSubtotal.toFixed(2)}</span>
        </div>
        {shownDiscount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Discount{coupon?.code ? ` (${coupon.code})` : ''}</span>
            <span>-€{shownDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery{selectedMethod ? ` (${selectedMethod.name})` : ''}</span>
          {selectedMethod ? (
            selectedMethod.fee > 0
              ? <span className="text-white">{euro(selectedMethod.fee)}</span>
              : <span className="text-emerald-400 font-bold">FREE</span>
          ) : (
            <span className="text-white/40">{quoteLoading ? 'Calculating…' : 'Select a method'}</span>
          )}
        </div>
        <div className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-white/5">
          <span>Grand Total</span>
          <span className="text-emerald-400 text-lg">
            {grandTotal !== null ? euro(grandTotal) : `${euro(Math.max(0, shownSubtotal - shownDiscount))}+`}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* ── Trust strip ── mirrors the checkout's job: reassure before asking for card details */}
      <div className="border-b border-white/5 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] sm:text-[11px] text-white/45 uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-500" /> 256-bit SSL encrypted</span>
          <span className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-500" /> Delivering across Ireland</span>
          <span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-emerald-500" /> Verified by Stripe</span>
          <span className="flex items-center gap-1.5"><Truck size={13} className="text-emerald-500" /> Tracked delivery</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {step === 'form' && (
          <>
            {/* Back link + heading */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white transition-colors mb-5 cursor-pointer"
            >
              <ArrowLeft size={13} /> Back to shop
            </button>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Secure <span className="text-emerald-400">Checkout</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/50 mt-1.5">
                Card and wallet payments, encrypted end-to-end by Stripe. Delivery within the Republic of Ireland.
              </p>
            </div>

            {/* ── Mobile order summary: a compact sticky totals bar that expands
                into the full line-item list. It's placed ABOVE the form (and
                therefore above the "Pay & Place Order" button, which lives
                inside the form) so on mobile the shopper always sees what
                they're paying before being asked to pay it. On desktop this
                is hidden entirely in favour of the sticky right-hand panel. */}
            <div className="lg:hidden mb-6 border border-white/10 bg-[#0c0c0c] rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setSummaryOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                  <ShoppingBag size={14} className="text-emerald-400" />
                  Order Summary · {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-400">
                    {grandTotal !== null ? euro(grandTotal) : `${euro(Math.max(0, shownSubtotal - shownDiscount))}+`}
                  </span>
                  <ChevronDown size={16} className={`text-white/40 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {summaryOpen && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  {OrderSummaryBody}
                </div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Shipping & Payment Form */}
              <div className="flex-1 space-y-6">
                <form onSubmit={handleCheckoutSubmit} noValidate className="space-y-6 text-xs">
                  {/* Section 1: Customer Contact */}
                  <div className="space-y-3 p-4 sm:p-5 bg-white/[0.02] border border-white/5 rounded-md">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-2 text-[10px] text-white/40">1. Customer Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="chk-name" className="block text-[9px] uppercase text-white/50 mb-1">Full Name *</label>
                        <input
                          id="chk-name" ref={firstFieldRef} type="text" required placeholder="e.g. John Doe"
                          autoComplete="name"
                          value={name} onChange={e => setName(e.target.value)}
                          onBlur={() => handleBlur('name', name)}
                          aria-invalid={!!(touched.name && errors.name)}
                          className={fieldClass('name')}
                        />
                        {touched.name && errors.name && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="chk-email" className="block text-[9px] uppercase text-white/50 mb-1">Email Address *</label>
                        <input
                          id="chk-email" type="email" required placeholder="e.g. john@example.com"
                          autoComplete="email"
                          value={email} onChange={e => setEmail(e.target.value)}
                          onBlur={() => handleBlur('email', email)}
                          aria-invalid={!!(touched.email && errors.email)}
                          className={fieldClass('email')}
                        />
                        {touched.email && errors.email && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.email}</p>
                        )}
                        <p className="mt-1 text-[9px] text-white/30">Your order confirmation and tracking link are sent here.</p>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="chk-phone" className="block text-[9px] uppercase text-white/50 mb-1">Phone Number *</label>
                      <input
                        id="chk-phone" type="tel" required placeholder="e.g. 087 123 4567"
                        autoComplete="tel"
                        value={phone} onChange={e => setPhone(e.target.value)}
                        onBlur={() => handleBlur('phone', phone)}
                        aria-invalid={!!(touched.phone && errors.phone)}
                        className={fieldClass('phone')}
                      />
                      {touched.phone && errors.phone && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.phone}</p>
                      )}
                      <p className="mt-1 text-[9px] text-white/30">Used by the courier if they need to reach you about your delivery.</p>
                    </div>
                  </div>

                  {/* Section 2: Delivery Address (Republic of Ireland only) */}
                  <div className="space-y-3 p-4 sm:p-5 bg-white/[0.02] border border-white/5 rounded-md">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-2 text-[10px] text-white/40">2. Delivery Address</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="chk-address" className="block text-[9px] uppercase text-white/50 mb-1">Address Line 1 *</label>
                        <input
                          id="chk-address" type="text" required placeholder="House number and street"
                          autoComplete="address-line1" maxLength={160}
                          value={address} onChange={e => setAddress(e.target.value)}
                          onBlur={() => handleBlur('address', address)}
                          aria-invalid={!!(touched.address && errors.address)}
                          className={fieldClass('address')}
                        />
                        {touched.address && errors.address && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.address}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="chk-address2" className="block text-[9px] uppercase text-white/50 mb-1">Address Line 2 (optional)</label>
                        <input
                          id="chk-address2" type="text" placeholder="Apartment, estate, townland"
                          autoComplete="address-line2" maxLength={160}
                          value={address2} onChange={e => setAddress2(e.target.value)}
                          className="w-full px-3 py-2.5 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white transition-colors rounded-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="chk-city" className="block text-[9px] uppercase text-white/50 mb-1">Town / City *</label>
                          <input
                            id="chk-city" type="text" required placeholder="e.g. Dublin"
                            autoComplete="address-level2" maxLength={80}
                            value={city} onChange={e => setCity(e.target.value)}
                            onBlur={() => handleBlur('city', city)}
                            aria-invalid={!!(touched.city && errors.city)}
                            className={fieldClass('city')}
                          />
                          {touched.city && errors.city && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.city}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="chk-county" className="block text-[9px] uppercase text-white/50 mb-1">County *</label>
                          <select
                            id="chk-county" required
                            autoComplete="address-level1"
                            value={county} onChange={e => { setCounty(e.target.value); handleBlur('county', e.target.value); }}
                            onBlur={() => handleBlur('county', county)}
                            aria-invalid={!!(touched.county && errors.county)}
                            className={`${fieldClass('county')} cursor-pointer`}
                          >
                            <option value="">Select county</option>
                            {IRISH_COUNTIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          {touched.county && errors.county && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.county}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="chk-postal" className="block text-[9px] uppercase text-white/50 mb-1">Eircode *</label>
                          <input
                            id="chk-postal" type="text" required placeholder="e.g. D02 X285"
                            autoComplete="postal-code" maxLength={8}
                            value={postalCode} onChange={e => setPostalCode(e.target.value.toUpperCase())}
                            onBlur={() => handleBlur('postalCode', postalCode)}
                            aria-invalid={!!(touched.postalCode && errors.postalCode)}
                            className={`${fieldClass('postalCode')} uppercase`}
                          />
                          {touched.postalCode && errors.postalCode && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.postalCode}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="chk-country" className="block text-[9px] uppercase text-white/50 mb-1">Country</label>
                          <input
                            id="chk-country" type="text" readOnly value={DELIVERY_COUNTRY}
                            autoComplete="country-name"
                            className="w-full px-3 py-2.5 bg-black/60 border border-white/10 text-white/70 outline-none rounded-sm cursor-not-allowed"
                          />
                          <p className="mt-1 text-[9px] text-white/30 flex items-center gap-1">
                            <MapPin size={10} className="text-emerald-500" /> Republic of Ireland only for now (no Northern Ireland).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Delivery (set by the business — the shopper does not choose) */}
                  <div className="space-y-3 p-4 sm:p-5 bg-white/[0.02] border border-white/5 rounded-md">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-2 text-[10px] text-white/40">3. Delivery</h3>

                    {quoteLoading && !quote ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-white/40 text-[11px]">
                        <Loader2 size={14} className="animate-spin" /> Calculating delivery…
                      </div>
                    ) : quoteError ? (
                      <div className="text-center py-5 space-y-3">
                        <AlertCircle size={20} className="mx-auto text-red-400" />
                        <p className="text-[11px] text-red-400">{quoteError}</p>
                        <button
                          type="button"
                          onClick={() => setQuoteTick(t => t + 1)}
                          className="px-4 py-2 border border-white/15 hover:bg-white/5 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded"
                        >
                          Retry
                        </button>
                      </div>
                    ) : quote && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3 p-3.5 border border-emerald-500/30 bg-emerald-500/5 rounded-sm">
                          <Truck size={16} className="text-emerald-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white uppercase text-[11px] tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {quote.delivery.name} · DPD
                            </p>
                            {estimateLabel(quote.delivery.estimateText, quote.delivery.estMinDays, quote.delivery.estMaxDays) && (
                              <p className="text-[10px] text-white/50 mt-0.5">
                                Estimated: {estimateLabel(quote.delivery.estimateText, quote.delivery.estMinDays, quote.delivery.estMaxDays)}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {quote.delivery.fee > 0 ? (
                              <span className="font-black text-white text-sm">{euro(quote.delivery.fee)}</span>
                            ) : (
                              <span className="font-black text-emerald-400 text-sm">FREE</span>
                            )}
                            {quote.delivery.freeApplied && quote.delivery.baseFee > 0 && (
                              <span className="block text-[9px] text-white/30 line-through">{euro(quote.delivery.baseFee)}</span>
                            )}
                          </div>
                        </div>

                        {quote.freeDelivery.available && (
                          quote.freeDelivery.amountToFree > 0 ? (
                            <p className="text-[10px] text-emerald-400/90 flex items-center gap-1.5">
                              <Truck size={11} /> Spend {euro(quote.freeDelivery.amountToFree)} more to get free delivery (orders of {euro(quote.freeDelivery.threshold)} or more).
                            </p>
                          ) : quote.delivery.freeApplied && (
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-semibold">
                              <CheckCircle2 size={11} /> Free delivery applied to your order.
                            </p>
                          )
                        )}

                        <p className="text-[9px] text-white/30 leading-relaxed">
                          Delivery times are estimates, not guarantees.{quote.notice ? ` ${quote.notice}` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Payment */}
                  <div className="space-y-3 p-4 sm:p-5 bg-white/[0.02] border border-white/5 rounded-md">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-2 text-[10px] text-white/40">4. Payment Details</h3>
                    <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-sm">
                      {stripePromise ? (
                        intentError ? (
                          <div className="text-center py-6 space-y-3">
                            <AlertCircle size={20} className="mx-auto text-red-400" />
                            <p className="text-[11px] text-red-400">{intentError}</p>
                            <button
                              type="button"
                              onClick={retryIntent}
                              className="px-4 py-2 border border-white/15 hover:bg-white/5 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded"
                            >
                              Retry
                            </button>
                          </div>
                        ) : !clientSecret ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-white/40 text-[11px]">
                            <Loader2 size={14} className="animate-spin" />
                            {quoteError ? 'Choose a delivery method to continue…' : 'Preparing secure payment form…'}
                          </div>
                        ) : (
                          <Elements
                            key={clientSecret}
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: { theme: "night" } }}
                          >
                            <StripePaymentSubForm
                              email={email}
                              total={grandTotal}
                              updating={intentUpdating || quoteLoading}
                              refreshToken={intentVersion}
                              validateShipping={validateShippingDetails}
                              onBeforeConfirm={() => ensureIntentCurrent(grandTotal)}
                              onSubmitSuccess={handleOrderSubmission}
                            />
                          </Elements>
                        )
                      ) : (
                        <div className="flex items-center gap-2 py-6 justify-center text-center text-[11px] text-white/40">
                          <AlertCircle size={14} className="text-white/30 shrink-0" />
                          Payment isn't configured for this environment. Please contact support.
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Right: Order Summary — sticky on desktop, hidden on mobile
                  (the accordion above covers that breakpoint instead) */}
              <div className="hidden lg:block w-full lg:w-96 xl:w-[420px]">
                <div className="bg-[#0c0c0c] border border-white/5 rounded-md p-6 sticky top-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-white/5 pb-2 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <ShoppingBag size={14} className="text-emerald-400" />
                    Order Summary
                  </h3>
                  {OrderSummaryBody}
                  <div className="flex items-center gap-1.5 text-[9px] text-white/30 pt-2 justify-center">
                    <ShieldCheck size={11} className="text-emerald-500" />
                    <span>256-Bit SSL Encrypted checkout.</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="w-full max-w-lg mx-auto py-10 sm:py-16 text-center flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-full">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Thank You For Your Order!
              </h2>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                Your payment was successfully processed. A confirmation email and receipt have been sent to {email || 'your inbox'}.
              </p>
            </div>

            {placedOrder && (
              <div className="p-4 bg-white/5 border border-white/5 max-w-sm w-full rounded text-xs text-left space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white/40">Order ID:</span>
                  <span className="font-bold text-white tracking-widest">#{placedOrder.id}</span>
                </div>
                {placedOrder.deliveryMethodName && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Delivery:</span>
                    <span className="font-bold text-white">
                      {placedOrder.deliveryMethodName} · {placedOrder.deliveryCost > 0 ? euro(placedOrder.deliveryCost) : 'FREE'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white/40">Paid Amount:</span>
                  <span className="font-bold text-emerald-400">€{placedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white/40">Payment Gateway:</span>
                  <span className="font-bold text-emerald-400 uppercase">Secure Card / Wallet</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-white/40 block">Delivery Address:</span>
                  <span className="text-white block font-medium">{placedOrder.customerName}</span>
                  <span className="text-white/60 block">
                    {[placedOrder.address, placedOrder.address2, placedOrder.city, placedOrder.county, placedOrder.postalCode, placedOrder.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 max-w-sm w-full rounded border border-emerald-500/20 bg-emerald-500/5 text-[11px] text-white/60">
              No account needed to track this order — just save your Order ID and email. You can look either up any time on the{' '}
              <button
                onClick={() => onNavigate('track-order')}
                className="text-emerald-400 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Track My Order
              </button>{' '}
              page.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={() => onNavigate('home')}
                className="flex-1 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs cursor-pointer transition-colors rounded-sm"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Continue Shopping
              </button>
              <button
                onClick={() => onNavigate('track-order')}
                className="flex-1 px-8 py-3 border border-white/15 hover:bg-white/5 text-white font-black uppercase tracking-widest text-xs cursor-pointer transition-colors rounded-sm"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Track My Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Sub-Form for Real Stripe Elements Integration. Unchanged in behaviour from
   the previous modal version — only the container page around it changed. */
interface StripeSubFormProps {
  email: string;
  total: number | null;
  // True while the server is (re)calculating the amount — the pay button is
  // locked so nobody can pay a stale total.
  updating: boolean;
  // Bumped each time the server changed the PaymentIntent amount.
  refreshToken: number;
  validateShipping: () => boolean;
  onBeforeConfirm: () => Promise<boolean>;
  onSubmitSuccess: (paymentIntentId: string) => Promise<void>;
}

const StripePaymentSubForm: React.FC<StripeSubFormProps> = ({
  email,
  total,
  updating,
  refreshToken,
  validateShipping,
  onBeforeConfirm,
  onSubmitSuccess
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const lastRefresh = useRef(refreshToken);

  // After the server changes the amount (e.g. delivery method switched), tell
  // Stripe's form to pick up the new amount. The card details stay filled in.
  useEffect(() => {
    if (!elements || refreshToken === lastRefresh.current) return;
    lastRefresh.current = refreshToken;
    elements.fetchUpdates().catch(() => { /* amount re-checked again right before paying */ });
  }, [refreshToken, elements]);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      toast.error('Payment form is still loading — please wait a moment.');
      return;
    }
    if (!validateShipping()) return;

    setLoading(true);
    try {
      // Make sure the amount Stripe will charge is the one on screen.
      if (!(await onBeforeConfirm())) return;

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email,
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setCardError(result.error.message || 'Payment confirmation failed.');
        toast.error(result.error.message || 'Payment confirmation failed.');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        await onSubmitSuccess(result.paymentIntent.id);
      } else if (result.paymentIntent) {
        toast.error(`Payment status: ${result.paymentIntent.status}. Please try again or use a different method.`);
      }
    } catch (err: any) {
      console.error('Stripe Payment error:', err);
      toast.error(err.message || 'An error occurred during Stripe Payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-[10px] text-white/40">
        <span className="flex items-center gap-1"><Lock size={10} className="text-emerald-400" /> SECURE PAYMENT PROTOCOL</span>
        <span className="text-white/30">Cards & wallets via Stripe</span>
      </div>

      <div
        className="relative p-4 bg-gradient-to-b from-white/[0.04] to-transparent border rounded-lg transition-all duration-200"
        style={{
          borderColor: cardError ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)',
        }}
      >
        <PaymentElement />
      </div>

      {cardError && (
        <p className="text-[10px] text-red-400 flex items-center gap-1 -mt-2"><AlertCircle size={10} />{cardError}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || updating || total === null || !stripe || !elements}
        aria-disabled={loading || updating || total === null || !stripe || !elements}
        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-sm"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" /> Authorising Payment...</>
        ) : updating || total === null ? (
          <><Loader2 size={14} className="animate-spin" /> Updating total...</>
        ) : (
          <>
            Pay & Place Order (€{total.toFixed(2)})
            <ArrowRight size={14} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/30 pt-0.5">
        <ShieldCheck size={11} className="text-white/30" />
        <span>Payments secured & encrypted by</span>
        <span className="font-bold text-white/50 tracking-tight">stripe</span>
      </div>
    </div>
  );
};