import { api } from './client';
import { Review } from '../types';

export const reviewsService = {
  addReview: (reviewData: {
    product_id: string | number;
    user_id: number;
    rating: number;
    comment: string;
}):
 Promise<Review> => 
    api.post('/api/reviews', reviewData),
  getAllReviews: (): Promise<Review[]> => 
    api.get('/api/reviews'),
  getProductReviews: (productId: string | number): Promise<Review[]> => 
    api.get(`/api/reviews/product/${productId}`),
  approveReview: (id: number): Promise<any> => 
    api.put(`/api/reviews/${id}/approve`, {}),
  rejectReview: (id: number): Promise<any> => 
    api.put(`/api/reviews/${id}/reject`, {}),
  deleteReview: (id: number): Promise<any> => 
    api.delete(`/api/reviews/${id}`)
};
