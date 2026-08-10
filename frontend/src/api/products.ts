import { api, API_URL } from './client';
import { Product, Category } from '../types';

const stripApiUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;
  if (url.startsWith(API_URL)) {
    return url.substring(API_URL.length);
  }
  return url;
};

// Builds a URL-safe slug (e.g. "Emerald Blend #2" -> "emerald-blend-2") for
// crawlable product/category URLs. Only used as a fallback when the backend
// doesn't already provide a `slug`, so existing data is never overridden.
const slugify = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const mapProductFromBackend = (p: any): Product => ({
  ...p,
  slug: p.slug || slugify(p.name) || String(p.id),
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
  slug: c.slug || slugify(c.name) || String(c.id),
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

  // Resolves a product from its SEO-friendly slug (falling back to id match
  // for older links), so a direct/refreshed visit to a product URL can look
  // up the right product without any dedicated backend endpoint.
  getProductBySlug: async (slug: string): Promise<Product | undefined> => {
    const products = await productsService.getProducts();
    return products.find((p: any) => p.slug === slug || String(p.id) === slug);
  },

  // Resolves a category from its SEO-friendly slug (falling back to id
  // match for older links), so a direct/refreshed visit to a category URL
  // can look up the right category without any dedicated backend endpoint.
  getCategoryBySlug: async (slug: string): Promise<Category | undefined> => {
    const categories = await productsService.getCategories();
    return categories.find((c: any) => c.slug === slug || String(c.id) === slug);
  },

  // Resolves a single product by SEO-friendly slug OR id. This is what
  // ProductPage.tsx falls back to when the product it needs isn't already
  // in the catalog App.tsx has loaded (e.g. a deep link/refresh straight
  // into a product page before the full catalog fetch resolves). Throws
  // (rather than resolving undefined) when nothing matches, since
  // ProductPage's catch block is what renders the "Product Not Found" page.
  getProduct: async (idOrSlug: string | number): Promise<Product> => {
    const product = await productsService.getProductBySlug(String(idOrSlug));
    if (!product) {
      throw new Error(`Product not found: ${idOrSlug}`);
    }
    return product;
  },

  uploadProductImage: (formData: FormData): Promise<{ success: boolean; image: string }> => 
    api.post('/api/upload/product', formData),
    
  uploadCategoryImage: (formData: FormData): Promise<{ success: boolean; image: string }> => 
    api.post('/api/upload/category', formData)
};