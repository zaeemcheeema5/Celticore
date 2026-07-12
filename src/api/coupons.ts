// src/api/coupons.ts
import { api } from './client';
import { Coupon } from '../types';

export const couponsService = {
  getCoupons: (): Promise<Coupon[]> => api.get('/api/coupons'),
  createCoupon: (couponData: { code: string; discountPercent: number }): Promise<Coupon> => 
    api.post('/api/coupons', couponData),
  applyCoupon: (code: string): Promise<Coupon> => 
    api.post('/api/coupons/apply', { code }),
  deleteCoupon: (id: number | string): Promise<any> => 
    api.delete(`/api/coupons/${id}`)
};
