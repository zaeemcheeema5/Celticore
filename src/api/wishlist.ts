import { api, API_URL } from './client';
import { Product } from '../types';

// Wishlist rows come back as `wishlist.id AS wishlist_id` joined with `products.*`.
// Apply the same image-URL normalization products.ts applies everywhere else,
// so a relative /uploads/... path doesn't render broken if this list is ever
// displayed directly (currently only its length is used, in the navbar badge).
const mapWishlistItemFromBackend = (p: any): Product => ({
  ...p,
  wishlist_id: p.wishlist_id,
  originalPrice: p.original_price,
  stockQuantity: p.stock_quantity,
  lowStockThreshold: p.low_stock_threshold,
  isActive: p.is_active === undefined ? true : (p.is_active === 1 || p.is_active === true),
  flavours: Array.isArray(p.flavours) ? p.flavours : (p.flavours ? JSON.parse(p.flavours) : []),
  image: p.image && !p.image.startsWith('http') ? `${API_URL}${p.image}` : p.image
});

export const wishlistService = {
  getWishlist: async (userId: number): Promise<Product[]> => {
    const res = await api.get(`/api/wishlist/${userId}`);
    const rows = Array.isArray(res) ? res : [];
    return rows.map(mapWishlistItemFromBackend);
  },
  addToWishlist: (user_id: number, product_id: string | number): Promise<any> =>
    api.post('/api/wishlist', { user_id, product_id }),
  removeFromWishlist: (wishlistId: string | number): Promise<any> =>
    api.delete(`/api/wishlist/item/${wishlistId}`),
  clearWishlist: (userId: number): Promise<any> =>
    api.delete(`/api/wishlist/clear/${userId}`)
};
