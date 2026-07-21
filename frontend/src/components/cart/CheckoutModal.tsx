import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, ArrowRight, CheckCircle2, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

type PaymentMethodType = 'card' | 'gpay' | 'applepay';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { cartItems, subtotal, discount, total, coupon, placeOrder } = useCart();

  // Checkout flow step: 'form' | 'success'
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form shipping/billing inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United Kingdom');

  // GPay Sheet simulation states
  const [isGpaySheetOpen, setIsGpaySheetOpen] = useState(false);
  const [gpayLoading, setGpayLoading] = useState(false);
  const [gpayEmail, setGpayEmail] = useState('');
  const [gpayCard, setGpayCard] = useState('');

  // Apple Pay Sheet simulation states
  const [isApplePaySheetOpen, setIsApplePaySheetOpen] = useState(false);
  const [applePayLoading, setApplePayLoading] = useState(false);
  const [applePayEmail, setApplePayEmail] = useState('');
  const [applePayCard, setApplePayCard] = useState('');

  // Interactive Mock Credit Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardType, setCardType] = useState<'unknown' | 'visa' | 'mastercard' | 'amex' | 'discover'>('unknown');

  // Auto-detect card brand
  useEffect(() => {
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (cleanNumber.startsWith('4')) {
      setCardType('visa');
    } else if (/^(5[1-5]|2[2-7])/.test(cleanNumber)) {
      setCardType('mastercard');
    } else if (/^3[47]/.test(cleanNumber)) {
      setCardType('amex');
    } else if (/^6(?:011|5)/.test(cleanNumber)) {
      setCardType('discover');
    } else {
      setCardType('unknown');
    }
  }, [cardNumber]);

  // Card number input formatter (groups of 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    setCardNumber(formatted.slice(0, 19));
  };

  // Expiry date formatter (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardExpiry(value.slice(0, 5));
  };

  // CVC formatter
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardCvc(value.slice(0, 4));
  };

  // Helper validation for the shipping details
  const validateShippingDetails = (): boolean => {
    if (!name.trim() || !email.trim() || !address.trim() || !city.trim() || !postalCode.trim()) {
      toast.error('Please enter all shipping details (Name, Email, Address, City, Postal Code) first.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const validateCardDetails = (): boolean => {
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    const cleanExpiry = cardExpiry.replace(/\s+/g, '');
    const cleanCvc = cardCvc.replace(/\s+/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      toast.error('Please enter a valid credit card number.');
      return false;
    }
    
    if (cleanExpiry.length !== 5 || !cleanExpiry.includes('/')) {
      toast.error('Please enter a valid expiry date (MM/YY).');
      return false;
    }

    const [monthStr, yearStr] = cleanExpiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt('20' + yearStr, 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month < 1 || month > 12) {
      toast.error('Expiry month must be between 01 and 12.');
      return false;
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      toast.error('The card is expired.');
      return false;
    }

    if (cleanCvc.length < 3) {
      toast.error('Please enter a valid CVC.');
      return false;
    }

    return true;
  };

  // Process order placement
  const handleOrderSubmission = async (methodUsed: PaymentMethodType, paymentIntentId?: string) => {
    setLoading(true);
    try {
      const order = await placeOrder({
        customerName: name,
        customerEmail: methodUsed === 'gpay' ? (gpayEmail || email) : methodUsed === 'applepay' ? (applePayEmail || email) : email,
        address: address,
        city: city,
        postalCode: postalCode,
        country: country,
        paymentMethod: methodUsed,
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntentId || `express_mock_${Date.now()}`
      });
      setPlacedOrder(order);
      setStep('success');
      // Trigger Confetti!
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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateShippingDetails()) return;

    // Process Credit Card Payment (if Stripe key is not configured, run mock validation)
    if (!stripePromise) {
      if (validateCardDetails()) {
        await handleOrderSubmission('card');
      }
    }
  };

  // Trigger Google Pay Checkout
  const handleGpayClick = () => {
    if (!validateShippingDetails()) return;
    setIsGpaySheetOpen(true);
  };

  // Confirm Google Pay Transaction
  const handleGpaySheetConfirm = () => {
    setGpayLoading(true);
    setTimeout(async () => {
      setIsGpaySheetOpen(false);
      setGpayLoading(false);
      await handleOrderSubmission('gpay', `gpay_intent_${Math.floor(Math.random() * 1000000)}`);
      toast.success('Paid successfully with Google Pay!');
    }, 1500);
  };

  // Trigger Apple Pay Checkout
  const handleApplePayClick = () => {
    if (!validateShippingDetails()) return;
    setIsApplePaySheetOpen(true);
  };

  // Confirm Apple Pay Transaction
  const handleApplePaySheetConfirm = () => {
    setApplePayLoading(true);
    setTimeout(async () => {
      setIsApplePaySheetOpen(false);
      setApplePayLoading(false);
      await handleOrderSubmission('applepay', `applepay_intent_${Math.floor(Math.random() * 1000000)}`);
      toast.success('Paid successfully with Apple Pay!');
    }, 1500);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/95 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative w-full max-w-6xl rounded border border-white/10 bg-[#090909] text-white flex flex-col lg:flex-row shadow-2xl overflow-hidden animate-fade-up max-h-[95vh]"
          style={{
            boxShadow: "0 0 60px rgba(16,185,129,0.12)",
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          {step === 'form' ? (
            <>
              {/* Left Panel: Shipping & Payment Form */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[95vh] lg:max-h-none">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-400" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Secure Checkout
                  </h2>
                  <p className="text-xs text-white/50">All orders are securely processed. Cash on Delivery option has been removed.</p>
                </div>

                {/* Shipping Details form must be filled first to unlock Express Checkout */}
                <form onSubmit={handleCheckoutSubmit} className="space-y-5 text-xs">
                  {/* Section 1: Customer Contact */}
                  <div className="space-y-3">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[10px] text-white/40">1. Customer Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase text-white/50 mb-1">Full Name *</label>
                        <input
                          type="text" required placeholder="e.g. John Doe"
                          value={name} onChange={e => setName(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase text-white/50 mb-1">Email Address *</label>
                        <input
                          type="email" required placeholder="e.g. john@example.com"
                          value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Shipping Address */}
                  <div className="space-y-3">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[10px] text-white/40">2. Shipping Address</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] uppercase text-white/50 mb-1">Address *</label>
                        <input
                          type="text" required placeholder="Street address, apartment, suite"
                          value={address} onChange={e => setAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase text-white/50 mb-1">City *</label>
                          <input
                            type="text" required placeholder="e.g. London"
                            value={city} onChange={e => setCity(e.target.value)}
                            className="w-full px-3 py-2 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-white/50 mb-1">Postal Code *</label>
                          <input
                            type="text" required placeholder="e.g. EC1A 1BB"
                            value={postalCode} onChange={e => setPostalCode(e.target.value)}
                            className="w-full px-3 py-2 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase text-white/50 mb-1">Country / Region</label>
                        <select
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

                  {/* Google Pay / Apple Pay Express Buttons */}
                  <div className="space-y-3">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[10px] text-white/40">3. Express Checkout</h3>
                    <p className="text-[10px] text-white/45 italic leading-tight mb-2">Note: Please fill in your shipping details above first to unlock Express Checkout.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Google Pay */}
                      <button
                        type="button"
                        onClick={handleGpayClick}
                        className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-white text-black font-black uppercase text-xs tracking-wider rounded border border-white/15 hover:bg-white/90 transition-all cursor-pointer shadow-md"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {/* Google logo G */}
                        <svg className="h-4 w-auto inline-block align-middle" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Pay with GPay</span>
                      </button>

                      {/* Apple Pay */}
                      <button
                        type="button"
                        onClick={handleApplePayClick}
                        className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-[#111] text-white font-black uppercase text-xs tracking-wider rounded border border-white/10 hover:bg-[#1f1f1f] transition-all cursor-pointer shadow-md"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        <span className="text-sm font-semibold tracking-tighter lowercase pr-0.5"></span>
                        <span>Pay with Apple Pay</span>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[9px] text-white/30 uppercase tracking-widest font-black">Or checkout using card details</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {/* Section 4: Card details */}
                  <div className="space-y-3">
                    <h3 className="font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[10px] text-white/40">4. Card details</h3>
                    <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-sm">
                      {stripePromise ? (
                        /* Real Stripe Integration Wrapper */
                        <Elements stripe={stripePromise}>
                          <StripePaymentSubForm
                            email={email}
                            name={name}
                            address={address}
                            city={city}
                            postalCode={postalCode}
                            country={country}
                            total={total}
                            items={cartItems.map(item => ({ id: item.product.id, quantity: item.quantity }))}
                            couponCode={coupon?.code}
                            onSubmitSuccess={(intentId) => handleOrderSubmission('card', intentId)}
                          />
                        </Elements>
                      ) : (
                        /* Mock Card Form Wrapper */
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-white/40">
                            <span className="flex items-center gap-1"><Lock size={10} className="text-emerald-400" /> SECURE CARD PAYMENT PROTOCOL</span>
                            <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-sm font-bold">SECURE CHANNEL</span>
                          </div>
                          
                          <div>
                            <label className="block text-[9px] uppercase text-white/50 mb-1">Card Number</label>
                            <div className="relative">
                              <input
                                type="text" required placeholder="4242 4242 4242 4242"
                                value={cardNumber} onChange={handleCardNumberChange}
                                className="w-full pl-3 pr-10 py-2.5 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white tracking-widest"
                              />
                              {cardType !== 'unknown' && (
                                <span className="absolute right-3 top-2.5 text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                                  {cardType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] uppercase text-white/50 mb-1">Expiry Date</label>
                              <input
                                type="text" required placeholder="MM/YY"
                                value={cardExpiry} onChange={handleExpiryChange}
                                className="w-full px-3 py-2.5 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white tracking-widest text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase text-white/50 mb-1">CVC / CVV</label>
                              <input
                                type="password" required placeholder="•••"
                                value={cardCvc} onChange={handleCvcChange}
                                className="w-full px-3 py-2.5 bg-black border border-white/10 focus:border-emerald-500/60 outline-none text-white tracking-widest text-center"
                              />
                            </div>
                          </div>
                          <p className="text-[9px] text-white/30 italic mt-1 leading-normal">
                            Test card: Use number 4242 4242... future expiry (e.g. 12/28) and any CVC.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Standard Card Submit Button (StripeElements wrapper renders its own button) */}
                  {!stripePromise && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {loading ? (
                        <>Processing Order...</>
                      ) : (
                        <>
                          Pay & Place Order (€{total.toFixed(2)})
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  )}
                </form>
              </div>

              {/* Right Panel: Order Summary */}
              <div className="w-full lg:w-96 xl:w-[420px] bg-[#0c0c0c] border-t lg:border-t-0 lg:border-l border-white/5 p-4 sm:p-6 md:p-8 flex flex-col overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-white/5 pb-2 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <ShoppingBag size={14} className="text-emerald-400" />
                    Order Summary
                  </h3>

                  {/* Items list */}
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

                {/* Price Calculations */}
                <div className="border-t border-white/5 pt-4 mt-6 space-y-2 text-xs text-white/50">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">€{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
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
                    <span className="font-bold text-white uppercase">
                      {placedOrder.paymentMethod === 'gpay' ? 'Google Pay Wallet' : placedOrder.paymentMethod === 'applepay' ? 'Apple Pay Wallet' : 'Credit/Debit Card'}
                    </span>
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

      {/* Simulated Google Pay sheet modal overlay */}
      {isGpaySheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full sm:max-w-md bg-[#121212] border border-white/10 rounded-t-xl sm:rounded-lg text-white shadow-2xl p-6 space-y-5"
            style={{ animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            {/* GPay Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-1.5">
                {/* Google multi color G logo */}
                <svg className="h-4.5 w-auto" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-bold text-sm text-white/90">Google Pay</span>
              </div>
              <button
                onClick={() => setIsGpaySheetOpen(false)}
                className="text-white/40 hover:text-white cursor-pointer p-1.5 -m-1.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* GPay Merchant / Total Info */}
            <div className="text-center py-2 space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Pay Merchant</p>
              <h4 className="text-lg font-black uppercase text-emerald-400" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Phase Fit Supplements</h4>
              <p className="text-2xl font-black text-white">€{total.toFixed(2)}</p>
            </div>

            {/* GPay Details */}
            <div className="space-y-3.5 text-xs text-white/80 bg-white/5 p-4 rounded border border-white/5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-0">
                <span className="text-white/40 font-medium">Google Account *</span>
                <input
                  type="email" required
                  value={gpayEmail}
                  onChange={(e) => setGpayEmail(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="bg-black/60 border border-white/10 px-2 py-1.5 sm:py-1 rounded text-white text-left sm:text-right focus:border-emerald-500 outline-none w-full sm:w-48 font-semibold text-xs"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-0 border-t border-white/5 pt-2.5">
                <span className="text-white/40 font-medium">Billing & Card *</span>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={12} className="text-emerald-400 shrink-0" />
                  <input
                    type="text" required
                    value={gpayCard}
                    onChange={(e) => setGpayCard(e.target.value)}
                    placeholder="e.g. Visa •••• 9911 or Bank details"
                    className="bg-black/60 border border-white/10 px-2 py-1.5 sm:py-1 rounded text-white text-left sm:text-right focus:border-emerald-500 outline-none w-full sm:w-48 font-semibold text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 border-t border-white/5 pt-2.5">
                <span className="text-white/40 font-medium">Fulfillment Address</span>
                <span className="font-semibold text-white sm:text-right sm:max-w-[200px]">
                  {name}<br />
                  <span className="text-[10px] text-white/60 font-light">
                    {address}, {city}, {postalCode}, {country}
                  </span>
                </span>
              </div>
            </div>

            {/* GPay CTA */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsGpaySheetOpen(false)}
                className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white font-bold text-xs uppercase cursor-pointer rounded transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={gpayLoading || !gpayEmail.trim() || !gpayCard.trim()}
                onClick={handleGpaySheetConfirm}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase cursor-pointer rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {gpayLoading ? (
                  <>Authorising...</>
                ) : (
                  <>Confirm & Pay</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Apple Pay sheet modal overlay */}
      {isApplePaySheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full sm:max-w-md bg-[#151517] border border-white/10 rounded-t-2xl sm:rounded-2xl text-white shadow-2xl p-6 space-y-5"
            style={{ animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            {/* Apple Pay Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-1">
                <span className="text-lg font-semibold tracking-tighter lowercase pr-0.5"></span>
                <span className="font-bold text-sm tracking-wider text-white">Apple Pay</span>
              </div>
              <button
                onClick={() => setIsApplePaySheetOpen(false)}
                className="text-white/40 hover:text-white cursor-pointer p-1.5 -m-1.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Apple Pay Merchant / Total Info */}
            <div className="text-center py-1 space-y-1">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Pay Merchant</p>
              <h4 className="text-md font-bold uppercase text-white">Phase Fit Supplements</h4>
              <p className="text-2xl font-black text-white">€{total.toFixed(2)}</p>
            </div>

            {/* Apple Pay Details */}
            <div className="space-y-3.5 text-xs text-white/80 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-0">
                <span className="text-white/40 font-medium">Apple ID Account *</span>
                <input
                  type="email" required
                  value={applePayEmail}
                  onChange={(e) => setApplePayEmail(e.target.value)}
                  placeholder="e.g. account@icloud.com"
                  className="bg-black/60 border border-white/15 px-2 py-1.5 sm:py-1 rounded text-white text-left sm:text-right focus:border-white outline-none w-full sm:w-48 font-semibold text-xs"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-0 border-t border-white/5 pt-2.5">
                <span className="text-white/40 font-medium">Billing & Card *</span>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={12} className="text-white/60 shrink-0" />
                  <input
                    type="text" required
                    value={applePayCard}
                    onChange={(e) => setApplePayCard(e.target.value)}
                    placeholder="e.g. Apple Card •••• 8888 or Bank details"
                    className="bg-black/60 border border-white/15 px-2 py-1.5 sm:py-1 rounded text-white text-left sm:text-right focus:border-white outline-none w-full sm:w-48 font-semibold text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 border-t border-white/5 pt-2.5">
                <span className="text-white/40 font-medium">Fulfillment Address</span>
                <span className="font-semibold text-white sm:text-right sm:max-w-[200px]">
                  {name}<br />
                  <span className="text-[10px] text-white/60 font-light">
                    {address}, {city}, {postalCode}, {country}
                  </span>
                </span>
              </div>
            </div>

            {/* Apple Pay CTA */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsApplePaySheetOpen(false)}
                className="flex-1 py-3.5 border border-white/10 hover:bg-white/5 text-white font-bold text-xs uppercase cursor-pointer rounded-full transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applePayLoading || !applePayEmail.trim() || !applePayCard.trim()}
                onClick={handleApplePaySheetConfirm}
                className="flex-1 py-3.5 bg-white hover:bg-white/90 text-black font-black text-xs uppercase cursor-pointer rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {applePayLoading ? (
                  <>Processing...</>
                ) : (
                  <>Confirm & Pay</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* Sub-Form for Real Stripe Elements Integration */
interface StripeSubFormProps {
  email: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  total: number;
  items: { id: string; quantity: number }[];
  couponCode?: string;
  onSubmitSuccess: (paymentIntentId: string) => Promise<void>;
}

const CARD_BRAND_ICONS: Record<string, React.JSX.Element> = {
  visa: (
    <svg viewBox="0 0 32 20" className="h-3.5 w-auto"><rect width="32" height="20" rx="3" fill="#1A1F71" /><text x="16" y="14" textAnchor="middle" fontSize="8" fontWeight="900" fontStyle="italic" fill="#fff" fontFamily="Arial, sans-serif">VISA</text></svg>
  ),
  mastercard: (
    <svg viewBox="0 0 32 20" className="h-3.5 w-auto"><rect width="32" height="20" rx="3" fill="#0a0a0a" /><circle cx="13" cy="10" r="6" fill="#EB001B" /><circle cx="19" cy="10" r="6" fill="#F79E1B" fillOpacity="0.9" /></svg>
  ),
  amex: (
    <svg viewBox="0 0 32 20" className="h-3.5 w-auto"><rect width="32" height="20" rx="3" fill="#2E77BC" /><text x="16" y="14" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">AMEX</text></svg>
  ),
  discover: (
    <svg viewBox="0 0 32 20" className="h-3.5 w-auto"><rect width="32" height="20" rx="3" fill="#111" /><text x="16" y="14" textAnchor="middle" fontSize="6" fontWeight="800" fill="#FF6000" fontFamily="Arial, sans-serif">DISC</text></svg>
  ),
  unknown: (
    <svg viewBox="0 0 32 20" className="h-3.5 w-auto opacity-30"><rect width="32" height="20" rx="3" fill="none" stroke="#ffffff40" /></svg>
  ),
};

const StripePaymentSubForm: React.FC<StripeSubFormProps> = ({
  email,
  name,
  address,
  city,
  postalCode,
  country,
  total,
  items,
  couponCode,
  onSubmitSuccess
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [cardBrand, setCardBrand] = useState('unknown');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async () => {

    if (!stripe || !elements) {
      toast.error('Stripe has not loaded yet.');
      return;
    }

    if (!name.trim() || !email.trim() || !address.trim() || !city.trim() || !postalCode.trim()) {
      toast.error('Please fill in all customer and shipping address details first.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create PaymentIntent on server. The server recalculates the
      // charge from real product prices + coupon — it does not trust a
      // client-supplied amount, so we send the cart contents, not a total.
      const { clientSecret } = await api.post('/api/payment/create-intent', {
        items,
        couponCode,
        receipt_email: email
      });

      // 2. Confirm card payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card Input Form element not found.');
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name,
            email,
            address: {
              line1: address,
              city,
              postal_code: postalCode,
              country: country === 'United Kingdom' ? 'GB' : 'US'
            }
          }
        }
      });

      if (result.error) {
        toast.error(result.error.message || 'Payment confirmation failed.');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // 3. Confirm order placement
        await onSubmitSuccess(result.paymentIntent.id);
      }
    } catch (err: any) {
      console.error('Stripe Payment error:', err);
      toast.error(err.message || 'An error occurred during Stripe Payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // This renders inside CheckoutModal's own <form onSubmit={handleCheckoutSubmit}>
    // (the shipping/customer-info form further up the tree). A <form> was
    // nested inside that outer <form> here before — invalid HTML, and the
    // likely cause of "clicking Pay & Place Order reloads the page back to
    // Home": nested forms make the browser's native submit-button-owner
    // resolution unreliable, so the click could fall through to a real
    // native form submission (a full page GET/reload) instead of being
    // handled by this component's own JS. Using a plain <div> here plus a
    // type="button" + onClick below means there is no second <form> at
    // all, so there's no native submission path left to fall through to.
    <div className="space-y-4">
      <div className="flex justify-between items-center text-[10px] text-white/40">
        <span className="flex items-center gap-1"><Lock size={10} className="text-emerald-400" /> SECURE CARD PAYMENT PROTOCOL</span>
        <div className="flex items-center gap-1.5">
          {['visa', 'mastercard', 'amex', 'discover'].map((brand) => (
            <span
              key={brand}
              className="transition-opacity duration-200"
              style={{ opacity: cardBrand === 'unknown' || cardBrand === brand ? 1 : 0.25 }}
            >
              {CARD_BRAND_ICONS[brand]}
            </span>
          ))}
        </div>
      </div>

      {/* Card input — glows emerald on focus, red on validation error */}
      <div
        className="relative p-4 bg-gradient-to-b from-white/[0.04] to-transparent border rounded-lg transition-all duration-200"
        style={{
          borderColor: cardError ? 'rgba(239,68,68,0.6)' : focused ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.1)',
          boxShadow: cardError
            ? '0 0 0 3px rgba(239,68,68,0.08)'
            : focused
            ? '0 0 0 3px rgba(16,185,129,0.10)'
            : 'none',
        }}
      >
        <CardElement
          onChange={(e) => {
            setCardBrand(e.brand || 'unknown');
            setCardComplete(e.complete);
            setCardError(e.error ? e.error.message : null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          options={{
            hidePostalCode: true, // postal code is already collected in the shipping section above
            style: {
              base: {
                color: '#ffffff',
                fontFamily: '"DM Sans", sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '14px',
                letterSpacing: '0.02em',
                '::placeholder': {
                  color: 'rgba(255,255,255,0.28)',
                },
              },
              invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
              },
            },
          }}
        />
        {cardComplete && !cardError && (
          <CheckCircle2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
        )}
      </div>

      {cardError && (
        <p className="text-[10px] text-red-400 flex items-center gap-1 -mt-2">{cardError}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !stripe || !cardComplete}
        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-sm"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {loading ? (
          <>Authorising Payment...</>
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