import { api, API_URL } from './client';
import { Order } from '../types';

// Delivery-related fields only. Used by the full mapper below and by the
// admin screen to merge a partial update response into an existing order.
// Accepts both the snake_case rows (admin / my orders) and the camelCase
// object the guest tracking endpoint returns.
export const mapDeliveryFields = (o: any) => ({
  address2: o.address2 || '',
  county: o.county || '',
  deliveryMethod: o.delivery_method || o.deliveryMethod || 'standard',
  deliveryMethodName: o.delivery_method_name || o.deliveryMethodName || '',
  deliveryCost: Number(o.delivery_cost ?? o.deliveryCost ?? 0),
  deliveryFree: o.delivery_free !== undefined ? Number(o.delivery_free) === 1 || o.delivery_free === true : !!o.deliveryFree,
  deliveryEstMinDays: o.delivery_est_min_days ?? o.deliveryEstMinDays ?? null,
  deliveryEstMaxDays: o.delivery_est_max_days ?? o.deliveryEstMaxDays ?? null,
  deliveryEstimateText: o.delivery_estimate_text || o.deliveryEstimateText || '',
  labelUploadedAt: o.label_uploaded_at || o.labelUploadedAt || null,
  courierName: o.courier_name || o.courierName || '',
  trackingNumber: o.tracking_number || o.trackingNumber || '',
  trackingUrl: o.tracking_url || o.trackingUrl || '',
  paidAt: o.paid_at || o.paidAt || null,
  processingAt: o.processing_at || o.processingAt || null,
  dispatchedAt: o.dispatched_at || o.dispatchedAt || null,
  deliveredAt: o.delivered_at || o.deliveredAt || null,
});

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
  discount: o.discount || 0,
  paymentMethod: o.payment_method || o.paymentMethod || 'card',
  paymentStatus: o.payment_status || o.paymentStatus || 'pending',
  subtotal: o.subtotal !== undefined && o.subtotal !== null ? Number(o.subtotal) : undefined,
  ...mapDeliveryFields(o),
  status: o.status || 'pending',
  canReview: !!o.canReview,
  createdAt: o.created_at || o.createdAt,
  stripePaymentIntentId: o.stripe_payment_intent_id || o.stripePaymentIntentId || ''
});

export const ordersService = {
  getAllOrders: async (): Promise<Order[]> => {
    const res = await api.get('/api/orders');
    const orders = Array.isArray(res) ? res : (res && Array.isArray(res.orders) ? res.orders : []);
    return orders.map(mapOrderFromBackend);
  },
  getMyOrders: async (): Promise<Order[]> => {
    const res = await api.get('/api/orders/mine');
    const orders = Array.isArray(res) ? res : [];
    return orders.map(mapOrderFromBackend);
  },
  // Guest order tracking — no login required. Calls the existing
  // POST /api/orders/track endpoint (Order ID + the email used at
  // checkout). The backend already supported this; nothing on the
  // frontend was calling it, which is why "Track My Order" only ever
  // showed a login gate for guests.
  trackOrder: async (orderId: string, email: string): Promise<Order> => {
    const res = await api.post('/api/orders/track', { orderId, email });
    const saved = res && res.order ? res.order : res;
    return mapOrderFromBackend(saved);
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
  },
  // Admin: change status and/or the manual courier details. Returns just the
  // fields that changed on the server (status, courier, tracking, dates) so
  // the caller can merge them into the order it already has on screen.
  updateDelivery: async (
    id: number | string,
    payload: { status?: string; courierName?: string; trackingNumber?: string; trackingUrl?: string }
  ): Promise<Partial<Order>> => {
    const res = await api.put(`/api/orders/${id}`, payload);
    const o = (res && res.order) || {};
    return {
      status: o.status,
      courierName: o.courier_name || '',
      trackingNumber: o.tracking_number || '',
      trackingUrl: o.tracking_url || '',
      processingAt: o.processing_at || null,
      dispatchedAt: o.dispatched_at || null,
      deliveredAt: o.delivered_at || null,
    };
  },
  deleteOrder: async (id: number | string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/api/orders/${id}`);
  },
  // ---- Manually uploaded DPD labels (admin only) ----
  // DPD API access is not confirmed, so labels are created in the DPD portal
  // and uploaded here as PDF / PNG / JPG (max 5 MB).
  uploadLabel: async (id: number | string, file: File): Promise<{ label_uploaded_at: string }> => {
    const form = new FormData();
    form.append('label', file);
    return api.post(`/api/delivery/orders/${id}/label`, form);
  },
  deleteLabel: async (id: number | string): Promise<void> => {
    await api.delete(`/api/delivery/orders/${id}/label`);
  },
  // Fetches the label with the admin's session and returns a temporary
  // browser URL for viewing / printing it.
  fetchLabelUrl: async (id: number | string): Promise<string> => {
    const res = await fetch(`${API_URL}/api/delivery/orders/${id}/label`, { credentials: 'include' });
    if (!res.ok) {
      let message = 'Could not open the label.';
      try { message = (await res.json()).error || message; } catch { /* keep default */ }
      throw new Error(message);
    }
    return URL.createObjectURL(await res.blob());
  },
};