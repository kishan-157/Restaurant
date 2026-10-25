import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, ItemVariant, AddonOption } from '../types';
import { safeStorage } from '../lib/storage';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    item: MenuItem,
    selectedVariant?: ItemVariant,
    selectedAddons?: AddonOption[],
    quantity?: number,
    customerNote?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  customizingItem: MenuItem | null;
  setCustomizingItem: (item: MenuItem | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'restaurant_cart_items_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = safeStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    safeStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    item: MenuItem,
    selectedVariant?: ItemVariant,
    selectedAddons: AddonOption[] = [],
    quantity: number = 1,
    customerNote?: string
  ) => {
    // Calculate unit price from trusted item or variant price + addons
    const basePrice = selectedVariant ? selectedVariant.price : item.price;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const unitPrice = basePrice + addonsTotal;
    const lineTotal = unitPrice * quantity;

    // Check if identical item configuration exists
    const addonIds = selectedAddons.map((a) => a.id).sort().join(',');
    const variantId = selectedVariant ? selectedVariant.id : 'none';
    const note = customerNote?.trim() || '';

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (c) =>
          c.item.id === item.id &&
          (c.selectedVariant?.id || 'none') === variantId &&
          c.selectedAddons.map((a) => a.id).sort().join(',') === addonIds &&
          (c.customerNote || '') === note
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal: existing.unitPrice * newQty,
        };
        return updated;
      }

      const newCartItem: CartItem = {
        cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        item,
        selectedVariant,
        selectedAddons,
        quantity,
        unitPrice,
        lineTotal,
        customerNote: note,
      };
      return [...prev, newCartItem];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              lineTotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalCount,
        isCartOpen,
        setIsCartOpen,
        customizingItem,
        setCustomizingItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
