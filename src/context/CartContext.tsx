import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, OrderItem, Coupon, Order } from '../types';
import { couponsService } from '../api/coupons';
import { ordersService } from '../api/orders';
import { toast } from 'sonner';

interface CartItem {
  product: Product;
  quantity: number;
  flavour: string;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon: Coupon | null;
  addToCart: (product: Product, quantity: number, flavour: string) => void;
  removeFromCart: (productId: string, flavour: string) => void;
  updateQuantity: (productId: string, flavour: string, quantity: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => Promise<void>;
  removeCouponCode: () => void;
  placeOrder: (shippingDetails: {
    customerName: string;
    customerEmail: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    paymentMethod: 'card' | 'gpay' | 'applepay';
    paymentStatus: 'paid' | 'unpaid' | 'pending';
    stripePaymentIntentId?: string;
  }) => Promise<Order>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  // Load cart from localStorage on init
  useEffect(() => {
    const savedCart = localStorage.getItem('cart_items');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart items", e);
      }
    }
  }, []);

  // Save cart to localStorage when changed
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('cart_items', JSON.stringify(items));
  };

  const addToCart = (product: Product, quantity: number, flavour: string) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.product.id === product.id && item.flavour === flavour
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      saveCart(updated);
    } else {
      saveCart([...cartItems, { product, quantity, flavour }]);
    }
    toast.success(`${product.name} (${flavour}) added to cart!`);
  };

  const removeFromCart = (productId: string, flavour: string) => {
    const updated = cartItems.filter(
      (item) => !(item.product.id === productId && item.flavour === flavour)
    );
    saveCart(updated);
  };

  const updateQuantity = (productId: string, flavour: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, flavour);
      return;
    }
    const updated = cartItems.map((item) =>
      item.product.id === productId && item.flavour === flavour
        ? { ...item, quantity }
        : item
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
    setCoupon(null);
  };

  const applyCouponCode = async (code: string) => {
    try {
      const result = await couponsService.applyCoupon(code);
      setCoupon(result);
      toast.success(`Coupon "${result.code}" applied! ${result.discountPercent}% off.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply coupon");
      throw err;
    }
  };

  const removeCouponCode = () => {
    setCoupon(null);
    toast.info("Coupon removed");
  };

  const placeOrder = async (shippingDetails: {
    customerName: string;
    customerEmail: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    paymentMethod: 'card' | 'gpay' | 'applepay';
    paymentStatus: 'paid' | 'unpaid' | 'pending';
    stripePaymentIntentId?: string;
  }): Promise<Order> => {
    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const items: OrderItem[] = cartItems.map((item) => ({
      product_id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      flavour: item.flavour,
    }));

    const orderData = {
      items,
      total,
      discount,
      ...shippingDetails,
    };

    try {
      const newOrder = await ordersService.placeOrder(orderData);
      clearCart();
      toast.success("Order placed successfully!");
      return newOrder;
    } catch (err: any) {
      toast.error("Failed to place order: " + err.message);
      throw err;
    }
  };

  // Calculations
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = coupon ? (subtotal * coupon.discountPercent) / 100 : 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        discount,
        total,
        coupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCouponCode,
        removeCouponCode,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
