import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { wishlistService } from '../api/wishlist';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WishlistContextType {
  wishlistItems: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  clearWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Load wishlist when user logs in or out.
  // Wishlist is per-account: unauthenticated visitors get an empty local list
  // rather than being defaulted onto a real user's account (previous behaviour
  // used a hardcoded user_id = 1 fallback, which let any guest read and clear
  // whichever real customer had database id 1).
  const loadWishlist = async () => {
    if (!isAuthenticated || !user) {
      setWishlistItems([]);
      return;
    }

    setLoading(true);
    try {
      const items = await wishlistService.getWishlist(user.id);
      setWishlistItems(items);
    } catch (err) {
      console.error("Failed to load wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user, isAuthenticated]);

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => String(item.id) === String(productId));
  };

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to use your wishlist.');
      return;
    }

    const existing = wishlistItems.find((item) => String(item.id) === String(product.id));

    try {
      if (existing) {
        // Remove — must send the wishlist row's own id (wishlist_id), not the
        // product id. The backend's DELETE /api/wishlist/item/:id deletes by
        // the wishlist table's primary key, which is a different value from
        // the product id and was previously never sent, so removals silently
        // matched zero rows.
        if (existing.wishlist_id === undefined) {
          toast.error('Could not remove item — missing wishlist reference. Try refreshing.');
          return;
        }
        await wishlistService.removeFromWishlist(existing.wishlist_id);
        setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(product.id)));
        toast.info(`${product.name} removed from wishlist`);
      } else {
        // Add
        await wishlistService.addToWishlist(user.id, product.id);
        // Re-fetch so the new item carries the real wishlist_id from the server
        // instead of guessing a local placeholder that later removals would need.
        await loadWishlist();
        toast.success(`${product.name} added to wishlist!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update wishlist");
    }
  };

  const clearWishlist = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to use your wishlist.');
      return;
    }

    try {
      await wishlistService.clearWishlist(user.id);
      setWishlistItems([]);
      toast.info("Wishlist cleared");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear wishlist");
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
