import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'customCart';

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // RFC4122 v4 variant
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const toHex = (n) => n.toString(16).padStart(2, '0');
    const hex = Array.from(bytes, toHex).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  // Fallback
  return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addToCart = useCallback((item) => {
    // expected fields: productId, title, thumbnail, previewImageURL, options, quantity, price
    const cartItem = {
      cartId: generateUuid(),
      productId: item.productId,
      title: item.title,
      thumbnail: item.previewImageURL || item.thumbnail,
      previewImageURL: item.previewImageURL || item.thumbnail,
      options: item.options || {},
      quantity: Number(item.quantity ?? 1),
      price: Number(item.price ?? 0),
    };
    setItems((prev) => [...prev, cartItem]);
    return cartItem;
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setItems((prev) => prev.filter((it) => it.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId, newQuantity) => {
    setItems((prev) =>
      prev.map((it) =>
        it.cartId === cartId ? { ...it, quantity: Math.max(1, newQuantity) } : it
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCart = useCallback(() => items, [items]);

  const getCount = useCallback(() => items.reduce((sum, it) => sum + (Number(it.quantity || 1)), 0), [items]);

  const total = useMemo(() => items.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 1)), 0), [items]);

  const value = useMemo(() => ({ items, addToCart, removeFromCart, updateQuantity, clearCart, getCart, getCount, total }), [items, addToCart, removeFromCart, updateQuantity, clearCart, getCart, getCount, total]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}


