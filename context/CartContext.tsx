'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { composeCampaignPrice, type MovementMarkupSnapshot } from '@/lib/campaign-pricing';

export interface CartItem {
  lineId: string;
  id: string;
  variantId: string;
  variantLabel?: string;
  name: string;
  price: number;
  basePrice: number;
  image: string;
  quantity: number;
  category?: string;
  spec?: string;
  productionDays?: number;
  pricingPolicyMinPrice?: number;
  campaignId?: string;
  campaignName?: string;
  campaignProgressivePriceRule?: string;
  organizationId?: string;
  priceCompositionVersion?: string;
  movementMarkup?: MovementMarkupSnapshot | null;
  customSpecs?: Record<string, string>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function buildLineId(item: Pick<CartItem, 'id' | 'variantId' | 'spec'>) {
  return `${item.id}:${item.variantId}:${item.spec ?? ''}`;
}

function applyPricingToCartItem(item: Omit<CartItem, 'lineId' | 'price'> & { lineId?: string; price?: number }, quantity: number): CartItem {
  const normalizedQuantity = Math.max(1, Math.floor(quantity));
  const basePrice = round2(item.basePrice ?? item.price ?? 0);
  const priceComposition = composeCampaignPrice({
    baseUnitPrice: basePrice,
    quantity: normalizedQuantity,
    progressivePriceRule: item.campaignProgressivePriceRule,
    minUnitPrice: item.pricingPolicyMinPrice,
  });
  const hasCampaignContext = Boolean(item.campaignId || item.campaignProgressivePriceRule);

  return {
    ...item,
    lineId: item.lineId ?? buildLineId(item),
    price: priceComposition.effectiveUnitPrice,
    basePrice,
    quantity: normalizedQuantity,
    priceCompositionVersion: hasCampaignContext ? priceComposition.priceCompositionVersion : undefined,
    movementMarkup: hasCampaignContext ? priceComposition.movementMarkup : undefined,
  };
}

function normalizeCartItem(input: CartItem | Record<string, unknown>) {
  const customSpecs =
    input.customSpecs && typeof input.customSpecs === 'object'
      ? (input.customSpecs as Record<string, string>)
      : undefined;
  const basePrice =
    typeof input.basePrice === 'number' && Number.isFinite(input.basePrice)
      ? input.basePrice
      : typeof input.price === 'number' && Number.isFinite(input.price)
        ? input.price
        : 0;

  return applyPricingToCartItem(
    {
      id: typeof input.id === 'string' ? input.id : '',
      variantId:
        typeof input.variantId === 'string' && input.variantId.trim().length > 0
          ? input.variantId
          : typeof customSpecs?.variantId === 'string' && customSpecs.variantId.trim().length > 0
            ? customSpecs.variantId
            : 'default',
      variantLabel: typeof input.variantLabel === 'string' ? input.variantLabel : undefined,
      name: typeof input.name === 'string' ? input.name : 'Produto',
      image: typeof input.image === 'string' ? input.image : '',
      price: typeof input.price === 'number' ? input.price : basePrice,
      basePrice,
      quantity: typeof input.quantity === 'number' ? input.quantity : 1,
      category: typeof input.category === 'string' ? input.category : undefined,
      spec: typeof input.spec === 'string' ? input.spec : undefined,
      productionDays: typeof input.productionDays === 'number' ? input.productionDays : undefined,
      pricingPolicyMinPrice: typeof input.pricingPolicyMinPrice === 'number' ? input.pricingPolicyMinPrice : undefined,
      campaignId: typeof input.campaignId === 'string' ? input.campaignId : undefined,
      campaignName: typeof input.campaignName === 'string' ? input.campaignName : undefined,
      campaignProgressivePriceRule:
        typeof input.campaignProgressivePriceRule === 'string' ? input.campaignProgressivePriceRule : undefined,
      organizationId: typeof input.organizationId === 'string' ? input.organizationId : undefined,
      customSpecs,
      lineId: typeof input.lineId === 'string' && input.lineId.trim().length > 0 ? input.lineId : undefined,
    },
    typeof input.quantity === 'number' ? input.quantity : 1
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [gifting, setGifting] = useState({ isGift: false, message: '', premiumPackage: false });

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ruah-cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as Array<CartItem | Record<string, unknown>>;
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((item) => normalizeCartItem(item))
            .filter((item) => item.id.trim().length > 0 && item.variantId.trim().length > 0);
          setTimeout(() => setCart(normalized), 0);
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
      const nextItem = applyPricingToCartItem(item, item.quantity);
      const existing = prev.find((row) => row.lineId === nextItem.lineId);
      if (existing) {
        return prev.map((row) =>
          row.lineId === nextItem.lineId ? applyPricingToCartItem({ ...row, ...nextItem }, row.quantity + nextItem.quantity) : row
        );
      }
      return [...prev, nextItem];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((item) => item.lineId !== lineId));
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.lineId === lineId ? applyPricingToCartItem(item, quantity) : item))
    );
  };

  const clearCart = () => setCart([]);

  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = round2(cart.reduce((acc, item) => acc + item.basePrice * item.quantity, 0));
  const total = round2(cart.reduce((acc, item) => acc + item.price * item.quantity, 0));
  const discount = round2(subtotal - total);

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
