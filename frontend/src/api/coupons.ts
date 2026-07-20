import { api } from './client';
import { Coupon } from '../types';

export const couponsService = {

  getCoupons: (): Promise<Coupon[]> =>
    api.get('/api/coupons'),

  createCoupon: (couponData: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    expiry_date?: string | null;
  }): Promise<any> =>
    api.post('/api/coupons', couponData),

  applyCoupon: (
    code: string,
    subtotal: number
  ): Promise<any> =>
    api.post('/api/coupons/apply', {
      code,
      subtotal
    }),

  deleteCoupon: (id: number | string): Promise<any> =>
    api.delete(`/api/coupons/${id}`)
};