import { api } from './client';
import { Review, ReviewSummary } from '../types';

export interface ProductReviewsQuery {
  sort?: 'newest' | 'highest' | 'lowest' | 'helpful';
  rating?: number;
  media?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductReviewsResult {
  reviews: Review[];
  total: number;
  hasMore: boolean;
}

function buildQuery(params: Record<string, any>): string {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (usable.length === 0) return '';
  return '?' + usable.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export const reviewsService = {
  // Customer-facing
  addReview: (reviewData: {
    productId: string | number;
    orderId: number;
    rating: number;
    title: string;
    review: string;
    images?: string[];
  }): Promise<{ id: number; message: string }> =>
    api.post('/api/reviews', reviewData),

  updateReview: (reviewId: number, reviewData: {
    rating?: number;
    title?: string;
    review?: string;
    images?: string[];
  }): Promise<{ message: string }> =>
    api.put(`/api/reviews/${reviewId}`, reviewData),

  getProductReviews: (productId: string | number, query: ProductReviewsQuery = {}): Promise<ProductReviewsResult> =>
    api.get(`/api/reviews/${productId}${buildQuery(query)}`),

  getProductReviewSummary: (productId: string | number): Promise<ReviewSummary> =>
    api.get(`/api/reviews/${productId}/summary`),

  getEligibility: (productId: string | number): Promise<{
    eligibleOrders: { orderId: number; deliveredAt: string }[];
    myReviews: Review[];
  }> =>
    api.get(`/api/reviews/eligibility/${productId}`),

  markHelpful: (reviewId: number): Promise<{ message: string; helpfulCount: number }> =>
    api.post(`/api/reviews/${reviewId}/helpful`, {}),

  uploadReviewImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    const res = await api.post('/api/upload/review', formData);
    return res.images || [];
  },

  // Admin-facing
  getAllReviews: (filters: { productId?: string; rating?: number; status?: string } = {}): Promise<Review[]> =>
    api.get(`/api/reviews/admin/all${buildQuery(filters)}`),

  updateReviewStatus: (reviewId: number, status: 'pending' | 'approved' | 'rejected'): Promise<any> =>
    api.patch(`/api/reviews/${reviewId}/status`, { status }),

  replyToReview: (reviewId: number, reply: string): Promise<any> =>
    api.post(`/api/reviews/${reviewId}/reply`, { reply }),

  deleteReview: (reviewId: number): Promise<any> =>
    api.delete(`/api/reviews/${reviewId}`)
};