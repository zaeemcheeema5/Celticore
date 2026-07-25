import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, ArrowRight, CheckCircle2, ShoppingBag, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
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
// @ts-ignore
import confetti from 'canvas-confetti';

// Load Stripe if a key is provided
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShippingErrors {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, subtotal, discount, total, coupon, placeOrder } = useCart();

  // Checkout flow step: 'form' | 'success'
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  // Form shipping/billing inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United Kingdom');

  // Inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<ShippingErrors>({});

  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Focus the first field when the modal opens, and let Escape close it
  useEffect(() => {
    if (isOpen && step === 'form') {
      firstFieldRef.current?.focus();
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, step, onClose]);

  // Create (or refresh) the PaymentIntent whenever the cart or coupon changes.
  // Guards against races: if the effect re-runs before a previous request
  // resolves, the stale response is discarded instead of overwriting a
  // newer clientSecret.
  useEffect(() => {
    if (!stripeKey || cartItems.length === 0) return;
    let cancelled = false;

    const createIntent = async () => {
      setIntentLoading(true);
      setIntentError(null);
      try {
        const response = await api.post("/api/payment/create-intent", {
          items: cartItems.map(item => ({
            id: item.product.id,
            quantity: item.quantity
          })),
          couponCode: coupon?.code
        });
        if (!cancelled) setClientSecret(response.clientSecret);
      } catch (err) {
        console.error(err);
        if (!cancelled) setIntentError("We couldn't set up secure payment. Please try again.");
      } finally {
        if (!cancelled) setIntentLoading(false);
      }
    };

    createIntent();
    return () => { cancelled = true; };
  }, [cartItems, coupon]);

  if (!isOpen) return null;

  // Field-level validation, run on blur and on submit so errors show inline
  // instead of only as a toast the user might miss.
  const validateField = (field: keyof ShippingErrors, value: string): string | undefined => {
    if (field === 'email') {
      if (!value.trim()) return 'Email is required.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Enter a valid email address.';
      return undefined;
    }
    const labels: Record<string, string> = {
      name: 'Full name', address: 'Address', city: 'City', postalCode: 'Postal code'
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
      ['name', name], ['email', email], ['address', address], ['city', city], ['postalCode', postalCode]
    ];
    const nextErrors: ShippingErrors = {};
    fields.forEach(([field, value]) => {
      const err = validateField(field, value);
      if (err) nextErrors[field] = err;
    });
    setErrors(nextErrors);
    setTouched({ name: true, email: true, address: true, city: true, postalCode: true });

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields before continuing.');
      return false;
    }
    return true;
  };

  // Process order placement. Every real payment now comes through the same
  // embedded Stripe PaymentElement — whether the customer actually paid
  // with a card, Google Pay, Apple Pay, or Link, Stripe settles it on the
  // same PaymentIntent, so it's recorded as 'card' here. That's also what
  // makes the backend treat it as a properly server-verified payment
  // (placeOrder re-checks the PaymentIntent status with Stripe directly
  // for paymentMethod === 'card') rather than the old simulated gpay/
  // applepay paths, which were never actually verified.
  const handleOrderSubmission = async (paymentIntentId: string) => {
    setLoading(true);
    try {
      const order = await placeOrder({
        customerName: name,
        customerEmail: email,
        address: address,
        city: city,
        postalCode: postalCode,
        country: country,
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

  // The outer <form> exists to group and validate shipping fields (and to
  // support Enter-to-advance between them). Actual payment is submitted
  // separately by StripePaymentSubForm's own button, since it needs the
  // Stripe `elements` context to confirm payment — this handler just
  // prevents an accidental native submit/page reload.
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const fieldClass = (field: keyof ShippingErrors) =>
    `w-full px-3 py-2 bg-black border outline-none text-white transition-colors ${
      touched[field] && errors[field]
        ? 'border-red-500/70 focus:border-red-500'
        : 'border-white/10 focus:border-emerald-500/60'
    }`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/95 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
          className="relative w-full max-w-6xl rounded border border-white/10 bg-[#090909] text-white flex flex-col lg:flex-row shadow-2xl overflow-hidden animate-fade-up max-h-[95vh]"
          style={{ boxShadow: "0 0 60px rgba(16,185,129,0.12)" }}
        >
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          {cartItems.length === 0 && step === 'form' ? (
            <div className="w-full p-10 text-center space-y-3">
              <ShoppingBag size={28} className="mx-auto text-white/30" />
              <p className="text-sm text-white/60">Your cart is empty — add something before checking out.</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : step === 'form' ? (
            <>
              {/* Left Panel: Shipping & Payment Form */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[95vh] lg:max-h-none">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-400" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Secure Checkout
                  </h2>
                  <p className="text-xs text-white/50">All orders are securely processed. Cash on Delivery option has been removed.</p>
                </div>

                <form onSubmit={handleCheckoutSubmit} noValidate className="space-y-5 text-xs">
                  {/* Section 1: Customer Contact */}
                  <div className="space-y-3">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[10px] text-white/40">1. Customer Information</h3>
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
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Shipping Address */}
                  <div className="space-y-3">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[10px] text-white/40">2. Shipping Address</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="chk-address" className="block text-[9px] uppercase text-white/50 mb-1">Address *</label>
                        <input
                          id="chk-address" type="text" required placeholder="Street address, apartment, suite"
                          autoComplete="street-address"
                          value={address} onChange={e => setAddress(e.target.value)}
                          onBlur={() => handleBlur('address', address)}
                          aria-invalid={!!(touched.address && errors.address)}
                          className={fieldClass('address')}
                        />
                        {touched.address && errors.address && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.address}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="chk-city" className="block text-[9px] uppercase text-white/50 mb-1">City *</label>
                          <input
                            id="chk-city" type="text" required placeholder="e.g. London"
                            autoComplete="address-level2"
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
                          <label htmlFor="chk-postal" className="block text-[9px] uppercase text-white/50 mb-1">Postal Code *</label>
                          <input
                            id="chk-postal" type="text" required placeholder="e.g. EC1A 1BB"
                            autoComplete="postal-code"
                            value={postalCode} onChange={e => setPostalCode(e.target.value)}
                            onBlur={() => handleBlur('postalCode', postalCode)}
                            aria-invalid={!!(touched.postalCode && errors.postalCode)}
                            className={fieldClass('postalCode')}
                          />
                          {touched.postalCode && errors.postalCode && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400"><AlertCircle size={10} />{errors.postalCode}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="chk-country" className="block text-[9px] uppercase text-white/50 mb-1">Country / Region</label>
                        <select
                          id="chk-country" autoComplete="country-name"
                          value={country} onChange={e => setCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white cursor-pointer"
                        >
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Australia">Australia</option>
                          <option value="Ireland">Ireland</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Payment — a single embedded Stripe element now
                      handles card, Google Pay, Apple Pay, Link, and anything
                      else enabled in the Stripe Dashboard. Wallet buttons
                      (when the browser/device supports them) render
                      automatically at the top of PaymentElement itself —
                      there's no separate Express Checkout section anymore. */}
                  <div className="space-y-3">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[10px] text-white/40">3. Payment Details</h3>
                    <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-sm">
                      {stripePromise ? (
                        intentError ? (
                          <div className="text-center py-6 space-y-3">
                            <AlertCircle size={20} className="mx-auto text-red-400" />
                            <p className="text-[11px] text-red-400">{intentError}</p>
                            <button
                              type="button"
                              onClick={() => { setClientSecret(''); setIntentError(null); /* effect re-fires on next cart/coupon change; force retry */ setIntentLoading(true); (async () => {
                                try {
                                  const response = await api.post("/api/payment/create-intent", {
                                    items: cartItems.map(item => ({ id: item.product.id, quantity: item.quantity })),
                                    couponCode: coupon?.code
                                  });
                                  setClientSecret(response.clientSecret);
                                } catch {
                                  setIntentError("Still unable to reach the payment service. Please try again shortly.");
                                } finally {
                                  setIntentLoading(false);
                                }
                              })(); }}
                              className="px-4 py-2 border border-white/15 hover:bg-white/5 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded"
                            >
                              Retry
                            </button>
                          </div>
                        ) : intentLoading || !clientSecret ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-white/40 text-[11px]">
                            <Loader2 size={14} className="animate-spin" />
                            Preparing secure payment form…
                          </div>
                        ) : (
                          <Elements
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: { theme: "night" } }}
                          >
                            <StripePaymentSubForm
                              email={email}
                              total={total}
                              validateShipping={validateShippingDetails}
                              onSubmitSuccess={handleOrderSubmission}
                            />
                          </Elements>
                        )
                      ) : (
                        /* No Stripe publishable key configured for this environment */
                        <div className="flex items-center gap-2 py-6 justify-center text-center text-[11px] text-white/40">
                          <AlertCircle size={14} className="text-white/30 shrink-0" />
                          Payment isn't configured for this environment. Please contact support.
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Panel: Order Summary (sticky on desktop) */}
              <div className="w-full lg:w-96 xl:w-[420px] bg-[#0c0c0c] border-t lg:border-t-0 lg:border-l border-white/5 p-4 sm:p-6 md:p-8 flex flex-col overflow-y-auto lg:sticky lg:top-0 lg:self-start lg:max-h-[95vh]">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-white/5 pb-2 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <ShoppingBag size={14} className="text-emerald-400" />
                    Order Summary
                  </h3>

                  <div className="space-y-3 divide-y divide-white/5 max-h-[35vh] lg:max-h-[40vh] overflow-y-auto pr-1">
                    {cartItems.map((item, index) => (
                      <div key={`${item.product.id}-${item.flavour}`} className={`flex gap-3 text-xs ${index > 0 ? 'pt-3' : ''}`}>
                        <img src={item.product.image} alt={item.product.name} className="w-10 h-10 object-cover bg-black border border-white/5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{item.product.name}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold">{item.flavour}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Qty: {item.quantity} · €{item.product.price.toFixed(2)}</p>
                        </div>
                        <span className="font-bold text-white pl-2">€{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 mt-6 space-y-2 text-xs text-white/50">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">€{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount{coupon?.code ? ` (${coupon.code})` : ''}</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-white/5">
                    <span>Grand Total</span>
                    <span className="text-emerald-400 text-lg">€{total.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] text-white/30 pt-3 justify-center">
                    <ShieldCheck size={11} className="text-emerald-500" />
                    <span>256-Bit SSL Encrypted checkout.</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Step 2: Success Screen */
            <div className="w-full p-6 sm:p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-5 sm:space-y-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-full">
                <CheckCircle2 size={32} className="sm:hidden" />
                <CheckCircle2 size={36} className="hidden sm:block" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Thank You For Your Order!
                </h2>
                <p className="text-sm text-white/60 max-w-md mx-auto">
                  Your payment was successfully processed. A confirmation email and receipt have been dispatched.
                </p>
              </div>

              {placedOrder && (
                <div className="p-4 bg-white/5 border border-white/5 max-w-sm w-full rounded text-xs text-left space-y-2">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Order ID:</span>
                    <span className="font-bold text-white tracking-widest">#{placedOrder.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Paid Amount:</span>
                    <span className="font-bold text-emerald-400">€{placedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Payment Gateway:</span>
                    <span className="font-bold text-emerald-400 uppercase">Secure Card / Wallet</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Fulfillment Method:</span>
                    <span className="font-bold text-white uppercase">Card / Digital Wallet (Stripe)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-white/40 block">Shipping Destination:</span>
                    <span className="text-white block font-medium">{placedOrder.customerName}</span>
                    <span className="text-white/60 block">{placedOrder.address}, {placedOrder.city}, {placedOrder.postalCode}</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs cursor-pointer transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* Sub-Form for Real Stripe Elements Integration.
   PaymentElement automatically renders whichever methods the PaymentIntent
   was created with (via automatic_payment_methods on the backend) that
   the customer's browser/device supports — card fields, plus wallet
   buttons (Google Pay / Apple Pay / Link) above them when available. */
interface StripeSubFormProps {
  email: string;
  total: number;
  validateShipping: () => boolean;
  onSubmitSuccess: (paymentIntentId: string) => Promise<void>;
}

const StripePaymentSubForm: React.FC<StripeSubFormProps> = ({
  email,
  total,
  validateShipping,
  onSubmitSuccess
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  // Populated only from Stripe's own confirmPayment error response —
  // there's no more client-side card-complete tracking to maintain.
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      toast.error('Payment form is still loading — please wait a moment.');
      return;
    }
    if (!validateShipping()) return;

    setLoading(true);
    try {
      // Confirms the SAME PaymentIntent that Elements was initialized
      // with in CheckoutModal — no second /create-intent call here.
      // Stripe reads the client secret from the Elements instance itself.
      // `return_url` is required by Stripe for any payment method that
      // may need an off-site redirect step (some wallets/local methods do,
      // depending on what's enabled in the Dashboard) — with
      // redirect: "if_required", it's only actually used when Stripe
      // determines a redirect is necessary; card/wallet payments that
      // don't need one resolve inline exactly as before.
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
    // Plain <div>, not a nested <form> — the outer shipping/customer-info
    // form further up the tree already owns a <form>. Nesting a second
    // <form> here is invalid HTML and made the browser's native
    // submit-button-owner resolution unreliable, which was the likely
    // cause of "clicking Pay & Place Order reloads the page." A div plus
    // an explicit type="button" onClick removes that failure path entirely.
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
        disabled={loading || !stripe || !elements}
        aria-disabled={loading || !stripe || !elements}
        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-sm"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" /> Authorising Payment...</>
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