import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// ── FIX: lee _id (MongoDB) o id (Supabase), lo que exista ──
const getId = (item) => item?._id ?? item?.id ?? null;

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    const productId = getId(product);               // ← antes: product._id
    setItems(prev => {
      const existing = prev.find(i => getId(i) === productId);  // ← antes: i._id === product._id
      if (existing) {
        return prev.map(i =>
          getId(i) === productId                    // ← antes: i._id === product._id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (id) =>
    setItems(prev => prev.filter(i => getId(i) !== id));        // ← antes: i._id !== id

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeItem(id);
    setItems(prev =>
      prev.map(i => getId(i) === id ? { ...i, quantity } : i)   // ← antes: i._id === id
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const count = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};