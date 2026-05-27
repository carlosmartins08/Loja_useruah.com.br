'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
  spec?: string;
  productionDays?: number;
  customSpecs?: Record<string, string>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  total: number;
  subtotal: number;
  discount: number;
  totalQuantity: number;
  gifting: {
    isGift: boolean;
    message: string;
    premiumPackage: boolean;
  };
  setGifting: (gifting: { isGift: boolean; message: string; premiumPackage: boolean }) => void;
  location: {
    region: string;
    shippingDays: number;
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [gifting, setGifting] = useState({ isGift: false, message: '', premiumPackage: false });
  const [location] = useState({ region: 'São Paulo', shippingDays: 2 });

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ruah-cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as CartItem[];
        if (Array.isArray(parsed)) {
          setTimeout(() => setCart(parsed), 0);
        }
      }
    } catch (e) {
      console.error('Failed to parse cart', e);
    } finally {
      setTimeout(() => setIsCartHydrated(true), 0);
    }
  }, []);

  useEffect(() => {
    if (!isCartHydrated) return;
    localStorage.setItem('ruah-cart', JSON.stringify(cart));
  }, [cart, isCartHydrated]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.spec === item.spec);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.spec === item.spec ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => setCart([]);

  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let discount = 0;
  if (totalQuantity >= 10) {
    discount = subtotal * 0.15;
  } else if (totalQuantity >= 5) {
    discount = subtotal * 0.1;
  } else if (totalQuantity >= 3) {
    discount = subtotal * 0.05;
  }

  const total = subtotal - discount;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        total,
        subtotal,
        discount,
        totalQuantity,
        gifting,
        setGifting,
        location
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
