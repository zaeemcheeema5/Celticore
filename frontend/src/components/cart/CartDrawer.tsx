import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenCheckout }) => {
  if (!isOpen) return null;

  const {
    cartItems,
    subtotal,
    discount,
    total,
    coupon,
    updateQuantity,
    removeFromCart,
    applyCouponCode,
    removeCouponCode,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplying(true);
    try {
      await applyCouponCode(couponCode);
      setCouponCode('');
    } catch (err) {
      // Error handled inside context toast
    } finally {
      setApplying(false);
    }
  };

  const handleCheckout = () => {
    onClose();
    onOpenCheckout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sliding Drawer Container */}
      <div
        className="w-full sm:max-w-md h-screen bg-[#090909] border-l border-white/10 text-white flex flex-col justify-between shadow-2xl relative"
        style={{
          animation: "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) both"
        }}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-emerald-400" />
            <h2 className="text-lg font-black tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Your Cart
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content / Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
              <ShoppingBag size={48} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-wider">Your cart is empty</p>
              <p className="text-xs mt-1">Add items from the collection to get started.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={`${item.product.id}-${item.flavour}`}
                className="flex gap-3 bg-white/5 border border-white/5 p-3 relative group"
              >
                {/* Product Image */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#111] shrink-0 overflow-hidden">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-xs font-black uppercase text-white truncate pr-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {item.product.name}
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-semibold">{item.flavour}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 border border-white/10 bg-black/40 px-1.5 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.flavour, item.quantity - 1)}
                        className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.flavour, item.quantity + 1)}
                        className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      €{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.product.id, item.flavour)}
                  className="absolute top-2 right-2 p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remove Item"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Coupon & Totals */}
        {cartItems.length > 0 && (
          <div className="p-3 sm:p-5 border-t border-white/5 bg-[#070707] space-y-4">
            {/* Coupon Code Input */}
            {coupon ? (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Tag size={12} />
                  <span>Coupon Applied: {coupon.code} (-{coupon.discountPercent}%)</span>
                </div>
                <button
                  onClick={removeCouponCode}
                  className="text-white/40 hover:text-white text-[10px] uppercase font-black cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discount Coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs text-white border border-white/10 focus:border-emerald-500/60 bg-black outline-none"
                />
                <button
                  type="submit"
                  disabled={applying}
                  className="px-4 py-2 text-xs font-black uppercase bg-white text-black hover:bg-white/80 transition-colors disabled:opacity-50 cursor-pointer"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {applying ? 'Applying...' : 'Apply'}
                </button>
              </form>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-white/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/5">
                <span>Total</span>
                <span className="text-base text-emerald-400">€{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tracking-widest uppercase transition-colors cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Proceed to Checkout
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
