export interface User {
  id: number;
  username?: string;
  name?: string;
  email: string;
  role?: 'main_admin' | 'admin' | 'customer';
}

export interface Product {
  id: string; // Keep string to support both existing hardcoded and auto-generated database IDs
  name: string;
  subtitle?: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  rating: number;
  reviews: number;
  badge?: string;
  flavours: string[];
  image: string;
  description: string;
  category?: string; // Links back to category id
  stock_quantity?: number;
  stockQuantity?: number;
  low_stock_threshold?: number;
  lowStockThreshold?: number;
  is_active?: boolean | number;
  isActive?: boolean | number;
  wishlist_id?: number | string; // present only when returned from GET /api/wishlist/:userId
}

export interface Category {
  id: string; // Or number from database, represented as string/number in frontend
  name: string;
  slug: string;
  tagline: string;
  description: string;
  Icon?: string | React.ComponentType<any>;
  accentColor?: string;
  accent_color?: string;
  effect: 'radial' | 'lightning' | 'ripple' | 'solar' | 'calm' | string;
  cardImage?: string;
  card_image?: string;
  image?: string;
}

export interface Review {
    id: number;
    productId: string | number;
    userId: number;
    orderId: number;
    rating: number;
    title: string;
    review: string;
    images: string[];
    isVerifiedPurchase: boolean;
    status: 'pending' | 'approved' | 'rejected';
    helpfulCount: number;
    adminReply?: string | null;
    adminReplyAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    reviewerName?: string;
    productName?: string;
}

export interface ReviewSummary {
    average: number;
    total: number;
    breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export interface OrderItem {
  product_id: string | number;
  name: string;
  price: number;
  quantity: number;
  flavour: string;
  review?: Review | null;
}

export interface Order {
  id: number;
  user_id?: number;
  items: OrderItem[];
  total: number;
  discount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  createdAt: string;
  canReview?: boolean;
  customerName: string;
  customerEmail: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  deliveryMethod?: string;
  deliveryCost?: number;
  paymentMethod: 'card' | 'gpay' | 'applepay';
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  stripePaymentIntentId?: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expiry_date?: string | null;
  is_active?: boolean | number;
}

export interface NutritionRequest {
  id: number;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  activity_level: string;
  diet_preference: string;
  medical_conditions: string;
  notes: string;
  admin_notes: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingReviews: number;
  pendingNutrition: number;
  unreadMessages: number;
}