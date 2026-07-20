import { api } from './client';
import { Order } from '../types';

const mapOrderFromBackend = (o: any): Order => ({
  id: o.id,
  customerName: o.customer_name || o.customerName,
  customerEmail: o.customer_email || o.customerEmail || '',
  address: o.address || '',
  city: o.city || '',
  postalCode: o.postal_code || o.postalCode || '',
  country: o.country || '',
  phone: o.phone || '',
  items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
  total: o.total || 0,
  paymentMethod: o.payment_method || o.paymentMethod || 'card',
  paymentStatus: o.payment_status || o.paymentStatus || 'pending',
  deliveryMethod: o.delivery_method || o.deliveryMethod || 'standard',
  deliveryCost: o.delivery_cost || o.deliveryCost || 0,
  status: o.status || 'pending',
  createdAt: o.created_at || o.createdAt,
  stripePaymentIntentId: o.stripe_payment_intent_id || o.stripePaymentIntentId || ''
});

export const ordersService = {
  getAllOrders: async (): Promise<Order[]> => {
    const res = await api.get('/api/orders');
    const orders = Array.isArray(res) ? res : (res && Array.isArray(res.orders) ? res.orders : []);
    return orders.map(mapOrderFromBackend);
  },
  placeOrder: async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
    const res = await api.post('/api/orders', orderData);
    const saved = res && res.order ? res.order : res;
    return mapOrderFromBackend(saved);
  },
  updateOrder: async (id: number | string, updateData: { status: string }): Promise<Order> => {
    const res = await api.put(`/api/orders/${id}`, updateData);
    const saved = res && res.order ? res.order : res;
    return mapOrderFromBackend(saved);
  }
};
