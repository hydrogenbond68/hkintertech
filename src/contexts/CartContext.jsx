import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [carts, setCarts] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const roleKey = useMemo(() => {
    if (!isAuthenticated) return 'guest';
    return isAdmin ? 'admin' : 'user';
  }, [isAuthenticated, isAdmin]);

  const currentCart = useMemo(() => {
    return carts[roleKey] || [];
  }, [carts, roleKey]);

  // Load carts from localStorage on mount
  useEffect(() => {
    try {
      const savedCarts = localStorage.getItem('carts');
      if (savedCarts) {
        const parsed = JSON.parse(savedCarts);
        if (parsed && typeof parsed === 'object') {
          setCarts(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading carts:', e);
    }
  }, []);

  // Update totals whenever currentCart changes
  useEffect(() => {
    try {
      const items = currentCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const price = currentCart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      setTotalItems(items);
      setTotalPrice(price);
    } catch (e) {
      console.error('Error calculating totals:', e);
    }
  }, [currentCart]);

  // Save carts to localStorage whenever carts change
  useEffect(() => {
    try {
      localStorage.setItem('carts', JSON.stringify(carts));
    } catch (e) {
      console.error('Error saving carts:', e);
    }
  }, [carts]);

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.id) {
      return;
    }

    setCarts(prev => {
      const existingItems = prev[roleKey] || [];
      const existingIndex = existingItems.findIndex(item => item.id === product.id);

      if (existingIndex !== -1) {
        const updated = [...existingItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 0) + quantity
        };
        return { ...prev, [roleKey]: updated };
      } else {
        const newItem = {
          ...product,
          quantity: quantity,
          price: product.price || 0
        };
        return { ...prev, [roleKey]: [...existingItems, newItem] };
      }
    });
  };

  const removeFromCart = (productId) => {
    setCarts(prev => {
      const existingItems = prev[roleKey] || [];
      const filtered = existingItems.filter(item => item.id !== productId);
      return { ...prev, [roleKey]: filtered };
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCarts(prev => {
      const existingItems = prev[roleKey] || [];
      return {
        ...prev,
        [roleKey]: existingItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      };
    });
  };

  const clearCart = () => {
    setCarts(prev => {
      const { [roleKey]: _, ...rest } = prev;
      try {
        localStorage.setItem('carts', JSON.stringify(rest));
      } catch (e) {
        console.error('Error clearing cart:', e);
      }
      return rest;
    });
  };

  const value = {
    cartItems: currentCart,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
