import { api } from './client';

export interface DeliveryOption {
  code: string;
  name: string;
  description: string;
  baseFee: number;
  fee: number;
  freeApplied: boolean;
  freeEligible: boolean;
  estMinDays: number;
  estMaxDays: number;
  estimateText: string;
}

// Customers do not choose a delivery method: the server applies the one the
// business has configured and returns it here.
export interface DeliveryQuote {
  subtotal: number;
  discount: number;
  goodsTotal: number;
  delivery: DeliveryOption;
  total: number;
  notice: string;
  freeDelivery: {
    enabled: boolean;
    threshold: number;
    amountToFree: number;
    available: boolean;
  };
}

export interface AdminDeliveryMethod {
  id?: number;
  code: string;
  name: string;
  description: string;
  fee: number;
  estMinDays: number;
  estMaxDays: number;
  estimateText: string;
  freeEligible: boolean;
  isEnabled: boolean;
}

export interface AdminDeliveryConfig {
  methods: AdminDeliveryMethod[];
  freeDelivery: { enabled: boolean; threshold: number };
  checkoutMethod: string;
  deliveryNotice: string;
  couriers?: { value: string; label: string }[];
}

export const deliveryService = {
  // Server-calculated subtotal / discount / delivery options for the cart.
  getQuote: async (
    items: { id: string; quantity: number }[],
    couponCode?: string
  ): Promise<DeliveryQuote> => {
    return api.post('/api/delivery/quote', { items, couponCode });
  },

  getAdminConfig: async (): Promise<AdminDeliveryConfig> => {
    return api.get('/api/delivery/admin/config');
  },

  saveAdminConfig: async (config: AdminDeliveryConfig): Promise<AdminDeliveryConfig> => {
    return api.put('/api/delivery/admin/config', {
      methods: config.methods,
      freeDelivery: config.freeDelivery,
      checkoutMethod: config.checkoutMethod,
      deliveryNotice: config.deliveryNotice,
    });
  },
};
