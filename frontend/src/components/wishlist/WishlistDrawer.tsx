import React from 'react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';
import { toast } from 'sonner';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDetails: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose, onOpenDetails }) => {
  if (!isOpen) return null;

  const { wishlistItems, toggleWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product: Product) => {
    const defaultFlavour = Array.isArray(product.flavours) && product.flavours.length > 0
      ? product.flavours[0]
      : '';
    addToCart(product, 1, defaultFlavour);
    toast.success(`${product.name} added to cart!`);
  };

  const handleOpenDetails = (product: Product) => {
    onClose();
    onOpenDetails(product);
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
            <Heart size={18} className="text-red-500 fill-red-500" />
            <h2 className="text-lg font-black tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Your Wishlist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content / Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {loading ? (
            <p className="text-xs text-white/30 italic text-center py-12">Loading your wishlist...</p>
          ) : wishlistItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
              <Heart size={48} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-wider">Your wishlist is empty</p>
              <p className="text-xs mt-1">Tap the heart on any product to save it here.</p>
            </div>
          ) : (
            wishlistItems.map((product) => (
              <div
                key={product.id}
                className="flex gap-3 bg-white/5 border border-white/5 p-3 relative group"
              >
                {/* Product Image */}
                <button
                  onClick={() => handleOpenDetails(product)}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-[#111] shrink-0 overflow-hidden cursor-pointer"
                >
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </button>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <button
                    onClick={() => handleOpenDetails(product)}
                    className="text-left cursor-pointer"
                  >
                    <h3 className="text-xs font-black uppercase text-white truncate pr-6 hover:text-emerald-400 transition-colors" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {product.name}
                    </h3>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      €{Number(product.price).toFixed(2)}
                    </p>
                  </button>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black transition-colors cursor-pointer"
                    >
                      <ShoppingCart size={11} />
                      Add to Cart
                    </button>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2 right-2 p-1.5 sm:p-1 text-white/30 sm:text-white/20 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remove from Wishlist"
                >
                  <Trash2 size={13} className="sm:hidden" />
                  <Trash2 size={12} className="hidden sm:block" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {wishlistItems.length > 0 && (
          <div className="p-3 sm:p-5 border-t border-white/5 bg-[#070707]">
            <button
              onClick={clearWishlist}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 hover:border-red-400/40 text-white/50 hover:text-red-400 font-bold text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <Trash2 size={12} />
              Clear Wishlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};