'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SessionTracker from '@/components/SessionTracker';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [discounts, setDiscounts] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountName, setDiscountName] = useState(null);

  const [syncMessages, setSyncMessages] = useState([]);

  // Fetch active discounts on mount
  useEffect(() => {
    fetch('/api/discounts/active')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDiscounts(data);
      })
      .catch(console.error);
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('elevated_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('elevated_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + quantity;
      
      if (newQty > product.stock) {
        setSyncMessages([`Sorry, we only have ${product.stock} of "${product.name}" in stock.`]);
        if (currentQty === product.stock) return prev;
        
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: product.stock } : item
          );
        }
        return [...prev, { ...product, quantity: product.stock }];
      }

      setSyncMessages([]);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          if (quantity > item.stock) {
            setSyncMessages([`Sorry, we only have ${item.stock} of "${item.name}" in stock.`]);
            return { ...item, quantity: item.stock };
          }
          setSyncMessages([]);
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Evaluate Discounts
  useEffect(() => {
    let bestAmt = 0;
    let bestName = null;

    for (const d of discounts) {
      let qualifyingTotal = 0;
      let targetIds = [];

      if (d.targetType === 'SPECIFIC_PRODUCTS' && d.targetProductIds) {
        try { targetIds = JSON.parse(d.targetProductIds); } catch (e) {}
      }

      for (const item of items) {
        const lineTotal = item.price * item.quantity;
        if (d.targetType === 'ENTIRE_ORDER') {
          qualifyingTotal += lineTotal;
        } else if (d.targetType === 'CATEGORY' && item.category === d.targetCategory) {
          qualifyingTotal += lineTotal;
        } else if (d.targetType === 'SPECIFIC_PRODUCTS' && targetIds.includes(item.id)) {
          qualifyingTotal += lineTotal;
        }
      }

      if (qualifyingTotal >= d.minOrderValue && qualifyingTotal > 0) {
        let amount = d.type === 'PERCENTAGE' 
          ? qualifyingTotal * (d.value / 100) 
          : d.value;
        if (amount > qualifyingTotal) amount = qualifyingTotal;
        
        if (amount > bestAmt) {
          bestAmt = amount;
          bestName = d.name;
        }
      }
    }

    setDiscountAmount(bestAmt);
    setDiscountName(bestName);
  }, [items, discounts]);

  const total = subtotal - discountAmount;

  const syncCart = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const res = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: items })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Prevent race condition: if cart was cleared while sync was in flight, do not restore items
        setItems(prev => {
          if (prev.length === 0) return prev;
          return data.items;
        });

        if (data.messages && data.messages.length > 0) {
          setSyncMessages(data.messages);
        }
      }
    } catch (e) {
      console.error('Failed to sync cart', e);
    }
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discountAmount,
        discountName,
        total,
        syncCart,
        syncMessages,
        setSyncMessages,
      }}
    >
      <SessionTracker />
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
