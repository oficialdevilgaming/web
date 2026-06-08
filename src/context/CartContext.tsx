"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'ADD_MULTIPLE_TO_CART'; payload: Product[] };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        const nextQty = existingItem.quantity + 1;
        if (nextQty > action.payload.stock) {
          return state; // Do not exceed stock
        }
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id ? { ...item, quantity: nextQty } : item
          ),
        };
      }
      if (action.payload.stock <= 0) {
        return state; // Do not add out of stock items
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case 'ADD_MULTIPLE_TO_CART': {
      const newItems = [...state.items];
      action.payload.forEach(product => {
        const existingIndex = newItems.findIndex(item => item.id === product.id);
        if (existingIndex > -1) {
          const nextQty = newItems[existingIndex].quantity + 1;
          if (nextQty <= product.stock) {
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: nextQty
            };
          }
        } else {
          if (product.stock > 0) {
            newItems.push({ ...product, quantity: 1 });
          }
        }
      });
      return { ...state, items: newItems };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === action.payload.id) {
            const requestedQty = Math.max(1, action.payload.quantity);
            const allowedQty = Math.min(requestedQty, item.stock);
            return { ...item, quantity: allowedQty };
          }
          return item;
        }),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load from localStorage only on client mount
  useEffect(() => {
    const localData = typeof window !== 'undefined' ? localStorage.getItem('devil_gaming_cart') : null;
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed.items) {
          dispatch({ type: 'LOAD_CART', payload: parsed.items });
        }
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }
  }, []);

  // Save to localStorage whenever state changes (and we are on client)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('devil_gaming_cart', JSON.stringify(state));
    }
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
