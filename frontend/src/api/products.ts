import { api, API_URL } from './client';
import { Product, Category } from '../types';

const stripApiUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;
  if (url.startsWith(API_URL)) {
    return url.substring(API_URL.length);
  }
  return url;
};

const mapProductFromBackend = (p: any): Product => ({
  ...p,
  originalPrice: p.original_price,
  stockQuantity: p.stock_quantity,
  lowStockThreshold: p.low_stock_threshold,
  isActive: p.is_active === undefined ? true : (p.is_active === 1 || p.is_active === true),
  flavours: Array.isArray(p.flavours) ? p.flavours : (p.flavours ? JSON.parse(p.flavours) : []),
  image: p.image && !p.image.startsWith('http') ? `${API_URL}${p.image}` : p.image
});

const mapProductToBackend = (p: any): any => ({
  id: p.id,
  name: p.name,
  subtitle: p.subtitle,
  brand: p.brand,
  category: p.category,
  price: p.price,
  original_price: p.originalPrice,
  image: stripApiUrl(p.image),
  description: p.description,
  badge: p.badge,
  flavours: p.flavours,
  rating: p.rating,
  reviews: p.reviews,
  stock_quantity: p.stockQuantity,
  low_stock_threshold: p.lowStockThreshold,
  is_active: p.isActive === undefined ? 1 : (p.isActive ? 1 : 0)
});

const mapCategoryFromBackend = (c: any): Category => ({
  ...c,
  cardImage: c.card_image && !c.card_image.startsWith('http') ? `${API_URL}${c.card_image}` : c.card_image,
  image: c.image && !c.image.startsWith('http') ? `${API_URL}${c.image}` : c.image,
  accentColor: c.accent_color || c.accentColor || '#10b981'
});

const mapCategoryToBackend = (c: any): any => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  image: stripApiUrl(c.image),
  card_image: stripApiUrl(c.cardImage),
  tagline: c.tagline,
  description: c.description,
  accent_color: c.accentColor || c.accent_color,
  effect: c.effect
});

export const productsService = {
  getProducts: async (): Promise<Product[]> => {
    const res = await api.get('/api/products');
    const products = Array.isArray(res) ? res : (res && Array.isArray(res.products) ? res.products : []);
    return products.map(mapProductFromBackend);
  },
  addProduct: async (product: any): Promise<Product> => {
    const payload = mapProductToBackend(product);
    const res = await api.post('/api/products', payload);
    const saved = res && res.product ? res.product : res;
    return mapProductFromBackend(saved);
  },
  updateProduct: async (id: string | number, product: any): Promise<any> => {
    const payload = mapProductToBackend(product);
    const res = await api.put(`/api/products/${id}`, payload);
    const saved = res && res.product ? res.product : res;
    return mapProductFromBackend(saved);
  },
  deleteProduct: (id: string | number): Promise<any> => api.delete(`/api/products/${id}`),
  
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/api/categories');
    const categories = Array.isArray(res) ? res : (res && Array.isArray(res.categories) ? res.categories : []);
    return categories.map(mapCategoryFromBackend);
  },
  addCategory: async (category: any): Promise<Category> => {
    const payload = mapCategoryToBackend(category);
    const res = await api.post('/api/categories', payload);
    const saved = res && res.category ? res.category : res;
    return mapCategoryFromBackend(saved);
  },
  updateCategory: async (id: string | number, category: any): Promise<any> => {
    const payload = mapCategoryToBackend(category);
    const res = await api.put(`/api/categories/${id}`, payload);
    const saved = res && res.category ? res.category : res;
    return mapCategoryFromBackend(saved);
  },
  deleteCategory: (id: string | number): Promise<any> => api.delete(`/api/categories/${id}`),

  uploadProductImage: (formData: FormData): Promise<{ success: boolean; image: string }> => 
    api.post('/api/upload/product', formData),
    
  uploadCategoryImage: (formData: FormData): Promise<{ success: boolean; image: string }> => 
    api.post('/api/upload/category', formData)
};
